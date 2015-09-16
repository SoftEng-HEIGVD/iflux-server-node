var
	_ = require('underscore'),
	clone = require('clone'),
	Promise = require('bluebird'),
	ruleDao = require('../persistence/ruleDao'),
	actionService = require('./actionService'),
	elasticSearchService = require('../../lib/ioc').create('elasticSearchService'),
	timeService = require('./timeService'),
	ruleConverter = require('../converters/ruleConverter'),
	ruleEngineConverter = require('../converters/ruleEngineConverter');

/**
 * The rules are the entities stored in the database
 */
var rules;

/**
 * Entities cache
 */
var cache = null;

/**
 * Rule Engine service.
 *
 * This service will manage the rules and evaluations of the rules.
 */
module.exports = {
	/**
	 * Populate the rules for the evaluation. This will act as a caching
   * mechanism to avoid retrieving the rules for each event received.
	 */
	populate: function() {
    cache = createEmptyCache();

    rules = {};

		return ruleDao
			.findAllEnabled()
			.each(function(ruleRetrieved) {
				return ruleConverter
					.convertForEvaluation(ruleRetrieved, cache)
					.then(function(ruleConverted) {
						rules[ruleConverted.id] = clone(ruleConverted);
					});
			})
			.then(function() {
				console.log('Rules reloaded');
			})
			.catch(function(err) {
				console.log('Unable to populate the rules.');
				console.log(err);
			})
			//.then(function() {
			//	console.log(cache);
			//	console.log(rules);
			//	_.each(rules, console.log);
			//})
		;
	},

	/**
	 * Match the events and send actions if necessary
	 *
	 * @param events The events to evaluate
	 */
	match: function(events) {
		var promise = Promise.resolve();

		if (_.isUndefined(rules) || _.isNull(rules) || _.isEmpty(rules)) {
			promise = promise.then(this.populate());
		}

		return promise
      .then(function() {
        return evaluate(cache, rules, events);
      })
      .then(function(data) {
        // Save the matched results to ElasticSearch
        _.each(data.matched, function(matched) {
          elasticSearchService.saveMatch(matched);
        });

        // Finally process the actions
        if (!_.isEmpty(data.actions)) {
          actionService.processActions(data.actions);
        }
    });
	},

  /**
   * Validate a single rule
   *
   * @param rule The rule to validate
   * @param event The event to validate
   * @returns {Object} The result of the validation
   */
  validate: function(rule, event) {
    var validationCache = createEmptyCache();
    var validationRules = {};

    return Promise.resolve()
      .then(function() {
        return ruleConverter
          .convertForEvaluation(rule, validationCache)
          .then(function(ruleConverted) {
            validationRules[ruleConverted.id] = clone(ruleConverted);
          })
          .then(function() {
            return evaluate(validationCache, validationRules, [ event ]);
          });
      })
      .catch(function(err) {
        console.log('Unable to validate rule %s.', rule.get('id'));
        console.log(err);
      });
  }
};

/**
 * Create an empty cache
 *
 * @returns {Object} The empty cache
 */
function createEmptyCache() {
  return {
    actionTargets: {},
    actionTargetTemplates: {},
    actionTypes: {},
    eventSources: {},
    eventTypes: {},
    rules: {}
  };
}

/**
 * Evaluate a list of events against the rules with the cache of models
 *
 * @param cache The cache that contains the different models associated with the rules (action types, ...)
 * @param rules The rules that must be evaluated
 * @param events The events to evaluate
 * @returns {{actions: Array, matched: Array}} The result of matching
 */
function evaluate(cache, rules, events) {
  var data = {
    actions: [],
    matched: []
  };

  // Analyze each received events
  _.each(_.isArray(events) ? events : [events], function (event) {
    if (_.isUndefined(event) || _.isNull(event)) {
      console.log('The event is null for a strange reason');
      return;
    }

    var eventMatchingResults = {};

    // Analyze each active rule
    _.each(rules, function (rule) {
      // Analyze each condition in the rule
      _.each(rule.conditions, function (condition, conditionIndex) {
        // Define the fields that can be evaluated
        var matchingBy = {
          conditionIndex: conditionIndex,
          source: isEventSourceDefined(condition),
          type: isEventTypeDefined(condition),
          function: !_.isUndefined(condition.fn)
        };

        // Retrieve the evaluator function
        var evaluationFn = eventMatchEngine[(matchingBy.source ? 's' : '') + (matchingBy.type ? 't' : '') + (matchingBy.function ? 'f' : '')];

        // Evaluate the condition
        if (evaluationFn(cache, condition, event)) {
          // First match
          if (!eventMatchingResults[rule.id]) {
            event.matchedAt = timeService.timestamp();

            eventMatchingResults[rule.id] = {
              rule: clone(rule),
              event: clone(event),
              matchedConditions: [],
              matchedActions: []
            };
          }

          // Store match
          eventMatchingResults[rule.id].matchedConditions.push({
            matchingBy: matchingBy
          });
        }
      }, this);
    }, this);

    // Evaluate the matches
    _.each(eventMatchingResults, function (eventMatchingResult) {
      // Evaluate the transformations
      _.each(eventMatchingResult.rule.transformations, function (transformation, transformationIndex) {
        // Define the fields that can be evaluated
        var matchingBy = {
          transformationIndex: transformationIndex,
          targetAndType: true // Mandatory evaluation
        };

        // Evaluate the transformation
        var actionTarget = cache.actionTargets[transformation.actionTarget.generatedIdentifier];
        var actionTargetTemplate = cache.actionTargetTemplates[actionTarget.get('action_target_template_id')];
        var actionType = cache.actionTypes[transformation.actionType.type];

        // Process the transformation of the event to the target format
        var action;

        // Only apply transformation if an expression is available
        if (transformation.fn) {
          action = transformation.fn.compiled(
            event,
            ruleEngineConverter.convertActionTarget(actionTarget),
            ruleEngineConverter.convertActionType(actionType),
            ruleEngineConverter.convertEventSource(event.source ? cache.eventSources[event.source] : null),
            ruleEngineConverter.convertEventType(event.type ? cache.eventTypes[event.type] : null),
            { json: JSON, console: console }
          );
        }
        else {
          action = _.pick(event, 'timestamp', 'source', 'type', 'properties');
        }

        // Store transformation
        eventMatchingResult.matchedActions.push({
          matchingBy: matchingBy,
          actionBody: action
        });

        data.actions.push({
          targetUrl: actionTargetTemplate.get('targetUrl'),
          targetToken: actionTargetTemplate.get('targetToken'),
          target: actionTarget.get('generatedIdentifier'),
          type: actionType.get('type'),
          properties: action
        });
      }, this);

      // Save in elastic search the event matching result
      data.matched.push(eventMatchingResult);
    }, this);
  }, this);

  return data;
}

/**
 * Check if an event source is defined on a condition.
 *
 * @param condition The condition to check
 * @returns {boolean} True if the event source is defined
 */
function isEventSourceDefined(condition) {
	return !_.isUndefined(condition.eventSource) && !_.isUndefined(condition.eventSource.generatedIdentifier);
}

/**
 * Check if an event type is defined on a condition.
 *
 * @param condition The condition to check
 * @returns {boolean} True if the event type is defined
 */
function isEventTypeDefined(condition) {
	return !_.isUndefined(condition.eventType) && !_.isUndefined(condition.eventType.type);
}

/**
 * Matching array functions to evaluate the different conditions
 * regarding of the data that are present in the condition.
 */
var eventMatchEngine = {
	f: function(cache, condition, event) { return matchConditionFunction(cache, condition, event); },
	t: function(cache, condition, event) { return matchConditionEventType(condition, event); },
	s: function(cache, condition, event) { return matchConditionEventSource(condition, event); },
	sf: function(cache, condition, event) { return matchConditionEventSource(condition, event) && matchConditionFunction(cache, condition, event); },
	tf: function(cache, condition, event) { return matchConditionEventType(condition, event) && matchConditionFunction(cache, condition, event); },
	st: function(cache, condition, event) { return matchConditionEventSource(condition, event) && matchConditionEventType(condition, event); },
	stf: function(cache, condition, event) { return matchConditionEventSource(condition, event) && matchConditionEventType(condition, event) && matchConditionFunction(cache, condition, event); },
	'': function(cache, condition, event) { return false; }
};

/**
 * Match an event with the condition based on the event source.
 *
 * @param condition The condition to evaluate
 * @param event The event to evaluate
 * @returns {boolean} True if the event source match with the event
 */
function matchConditionEventSource(condition, event) {
	return condition.eventSource.generatedIdentifier === event.source;
}

/**
 * Match an event with the condition based on the event type.
 *
 * @param condition The condition to evaluate
 * @param event The event to evaluate
 * @returns {boolean} True if the event type match with the event
 */
function matchConditionEventType(condition, event) {
	return condition.eventType.type === event.type;
}

/**
 * Match an event with the condition based on the expression function.
 *
 * @parma cache Cache that contains retrieved models
 * @param condition The condition to evaluate
 * @param event The event to evaluate
 * @returns {boolean} True if the function is correctly evaluated and return true.
 */
function matchConditionFunction(cache, condition, event) {
	return condition.fn.compiled(
		event,
		ruleEngineConverter.convertEventSource(cache.eventSources[event.source]),
		ruleEngineConverter.convertEventType(cache.eventTypes[event.type]),
		{ json: JSON, console: console }
	);
}
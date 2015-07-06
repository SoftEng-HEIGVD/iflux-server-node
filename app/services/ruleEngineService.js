var
	_ = require('underscore'),
	Promise = require('bluebird'),
	ruleDao = require('../persistence/ruleDao'),
	ruleConverter = require('../converters/ruleConverter'),
	ruleService = require('./ruleService'),
	actionService = require('./actionService'),
	elasticSearch = require('./elasticSearchService'),
	timeService = require('./timeService');

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
	 * Populate the rules for the evaluation. This will
	 * act as a caching mechanism to avoid retrieving the rules
	 * for each event received.
	 *
	 * @param {object} payload Something to return at the end of the promise chain
	 */
	populate: function(payload) {
		cache = {
			actionTargets: {},
			actionTargetTemplates: {},
			actionTypes: {},
			eventSources: {},
			eventTypes: {},
			rules: {}
		};

		rules = [];

		return ruleDao
			.findAllEnabled()
			.each(function(ruleRetrieved) {
				return ruleConverter
					.convertForEvaluation(ruleRetrieved, cache)
					.then(function(ruleConverted) {
						rules.push(ruleConverted);
					});
			})
			.then(function() {
				console.log('Rules reloaded');
				return payload;
			})
			.catch(function(err) {
				console.log("Unable to populate the rules.");
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
		var actions = [];

		var promise = Promise.resolve();

		if (_.isUndefined(rules) || _.isNull(rules) || _.isEmpty(rules)) {
			promise = promise.then(this.populate());
		}

		return promise.then(function() {
			// Analyze each received events
			_.each(_.isArray(events) ? events : [events], function (event) {
				var eventMatchingResults = {};

				// Analyze each active rule
				_.each(rules, function (rule) {

					// Analyze each condition in the rule
					_.each(rule.conditions, function (condition) {
						// Define the fields that can be evaluated
						var matchingBy = {
							source: isEventSourceDefined(condition),
							type: isEventTypeDefined(condition),
							function: !_.isUndefined(condition.fn)
						};

						// Retrieve the evaluator function
						var evaluationFn = eventMatchEngine[(matchingBy.source ? 's' : '') + (matchingBy.type ? 't' : '') + (matchingBy.function ? 'f' : '')];

						// Evaluate the condition
						if (evaluationFn(condition, event)) {
							// First match
							if (!eventMatchingResults[rule.id]) {
								event.matchedAt = timeService.timestamp();

								eventMatchingResults[rule.id] = {
									rule: rule,
									event: event,
									matchedConditions: [],
									transformations: []
								};
							}

							// Store match
							eventMatchingResults[rule.id].matchedConditions.push(_.extend({matchingBy: matchingBy}, condition));
						}
					}, this);
				}, this);

				// Evaluate the matches
				_.each(eventMatchingResults, function (eventMatchingResult) {
					// Evaluate the transformations
					_.each(eventMatchingResult.rule.transformations, function (transformation) {
						// Define the fields that can be evaluated
						var matchingBy = {
							targetAndType: true, // Mandatory evaluation
							eventType: isEventTypeDefined(transformation)
						};

						// Evaluate the transformation
						if (!matchingBy.eventType || matchTransformationEventType(transformation, event)) {
							var actionTarget = cache.actionTargets[transformation.actionTarget.generatedIdentifier];
							var actionTargetTemplate = cache.actionTargetTemplates[actionTarget.get('action_target_template_id')];
							var actionType = cache.actionTypes[transformation.actionType.type];

							// Process the transformation of the event to the target format
							var transformed;

							// Only apply transformation if an expression is available
							if (transformation.fn) {
								transformed = transformation.fn.compiled(
									event,
									actionTarget,
									actionType,
									cache.eventSources[event.source],
									cache.eventTypes[event.type],
									{ json: JSON, console: console }
								);
							}
							else {
								transformed = event;
							}

							// Store transformation
							eventMatchingResult.transformations.push(_.extend({
								matchingBy: matchingBy,
								transformed: transformed
							}, transformation));

							actions.push({
								targetUrl: actionTargetTemplate.get('targetUrl'),
								targetToken: actionTargetTemplate.get('targetToken'),
								target: actionTarget.get('generatedIdentifier'),
								type: actionType.get('type'),
								properties: transformed
							});
						}
					}, this);

					// Save in elastic search the event matching result
					elasticSearch.saveMatch(eventMatchingResult);
				}, this);
			}, this);

			// Finally process the actions
			if (!_.isEmpty(actions)) {
				actionService.processActions(actions);
			}
		});
	}
};

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
	f: function(condition, event) { return matchConditionFunction(condition, event); },
	t: function(condition, event) { return matchConditionEventType(condition, event); },
	s: function(condition, event) { return matchConditionEventSource(condition, event); },
	sf: function(condition, event) { return matchConditionEventSource(condition, event) && matchConditionFunction(condition, event); },
	tf: function(condition, event) { return matchConditionEventType(condition, event) && matchConditionFunction(condition, event); },
	st: function(condition, event) { return matchConditionEventSource(condition, event) && matchConditionEventType(condition, event); },
	stf: function(condition, event) { return matchConditionEventSource(condition, event) && matchConditionEventType(condition, event) && matchConditionFunction(condition, event); },
	'': function(condition, event) { return false; }
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
 * @param condition The condition to evaluate
 * @param event The event to evaluate
 * @returns {boolean} True if the function is correctly evaluated and return true.
 */
function matchConditionFunction(condition, event) {
	return condition.fn.compiled(
		event,
		cache.eventSources[event.source],
		cache.eventTypes[event.type],
		{ json: JSON, console: console }
	);
}

/**
 * Match an event with the transformation based on the event type.
 *
 * @param transformation The transformation to evaluate
 * @param event The event to evaluate
 * @returns {boolean} True if the event type match with the event
 */
function matchTransformationEventType(transformation, event) {
	return transformation.eventType.type === event.type;
}
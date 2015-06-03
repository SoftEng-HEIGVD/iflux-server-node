var
	_ = require('underscore'),
	Promise = require('bluebird'),
	actionTargetInstanceDao = require('../persistence/actionTargetInstanceDao'),
	actionTypeDao = require('../persistence/actionTypeDao'),
	eventSourceInstanceDao = require('../persistence/eventSourceInstanceDao'),
	eventTypeDao = require('../persistence/eventTypeDao'),
	organizationDao = require('../persistence/organizationDao'),
	ruleService = require('../services/ruleService');

/**
 * Rule validation error
 *
 * @param errors The errors gathered during validation
 * @constructor
 */
function RuleValidationError(errors) {
  this.name = 'RuleValidationError';
  this.message = 'Rule validation errors';
	this.errors = errors;
}

RuleValidationError.prototype = Object.create(Error.prototype);
RuleValidationError.prototype.constructor = RuleValidationError;

/**
 * Rule processing chain
 *
 * @param req The request to get the data for various validations and data collection
 * @param collectionRequired Define if the collection are mandatory or not
 * @constructor
 */
function RuleProcessingChain(req, collectionRequired) {
	this.req = req;

	// Initialize the validation chain for the rules validation.
	// This function is aimed to be used in POST and PATCH methods.
	this.promise = Promise
		.resolve({
			actionTargetInstances: {},
			eventSourceInstances: {},
			eventTypes: {},
			actionTypes: {},
			errors: {
				conditions: {},
				transformations: {}
			},
			user: req.userModel
		})
		.bind(this)

	// If collection are required, then they must be present in the request
	if (collectionRequired) {
		this.promise = this.promise.then(function (entities) {
			// Check there is at least one condition
			if (_.isUndefined(this.req.body.conditions) || this.req.body.conditions.length == 0) {
				entities.errors.conditions = ['At least one condition must be defined.'];
			}

			// Check there is at least one transformation
			if (_.isUndefined(this.req.body.transformations) || this.req.body.transformations.length == 0) {
				entities.errors.transformations = ['At least one transformation must be defined.'];
			}

			return entities;
		});
	}
	else {
		this.promise = this.promise.then(function (entities) {
			// If conditions is present, at least one condition must be configured
			if (req.body.conditions && req.body.conditions.length == 0) {
				entities.errors.conditions = ['At least one condition must be defined.'];
			}

			// If transformations is present, at least one transformation must be configured
			if (req.body.transformations && req.body.transformations.length == 0) {
				entities.errors.transformations = ['At least one transformation must be defined.'];
			}

			return entities;
		});
	}
}

RuleProcessingChain.prototype = _.extend(RuleProcessingChain.prototype, {
	/**
	 * Check if the organization is valid.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkOrganization: function() {
		this.promise = this.promise.then(function(entities) {
			if (this.req.body.organizationId) {
				return organizationDao
					.findByIdAndUser(this.req.body.organizationId, entities.user)
					.then(function(organization) {
						entities.organization = organization;
						return entities;
					})
					.catch(organizationDao.model.NotFoundError, function(err) {
						entities.errors.organizationId = [ 'Organization not found.' ];
						return entities;
					});
			}
			else {
				entities.errors.organizationId = [ 'Organization id is mandatory.' ];
			}

			return entities;
		});

		return this;
	},

	/**
	 * Check if each condition contains at least type of condition configuration.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkConditionsIntegrity: function () {
		this.promise = this.promise.then(function(entities) {
			return Promise
				.reduce(this.req.body.conditions || [], function (entities, condition, idx) {
					// Check there is at least one type of condition evaluation
					if (!condition.eventSourceInstanceId && !condition.eventTypeId && !condition.fn) {
						entities.errors.conditions[idx] = [ 'At least one of eventSourceInstanceId, eventTypeId or fn must be provided.' ];
					}

					return entities;
				}, entities);
		});

		return this;
	},

	/**
	 * When present, retrieve the event source instance from its id. This is done
	 * for each condition present in the rule.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkEventSourceInstances: function() {
		this.promise = this.promise.then(function(entities) {
			return Promise
				.reduce(this.req.body.conditions|| [], function (entities, condition, idx) {
					if (condition.eventSourceInstanceId && !entities.eventSourceInstances[condition.eventSourceInstanceId]) {
						return eventSourceInstanceDao
							.findByIdAndUser(condition.eventSourceInstanceId, entities.user)
							.then(function (eventSourceInstance) {
								entities.eventSourceInstances[condition.eventSourceInstanceId] = eventSourceInstance;
								return entities;
							})
							.catch(eventSourceInstanceDao.model.NotFoundError, function (err) {
								entities.errors.conditions[idx] = _.extend(entities.errors.conditions[idx] || {}, {eventSourceInstanceId: ['Event source instance not found.']});
								return entities;
							});
					}
					else {
						return entities;
					}
				}, entities);
		});

		return this;
	},

	/**
	 * When present, retrieve the event type from its id. This is done for
	 * each condition or transformation present in the rule.
	 *
	 * @param collectionName The name of the collection to analyse
	 * @returns {RuleProcessingChain} This
	 */
	checkEventTypes: function(collectionName) {
		this.promise = this.promise.then(function (entities) {
			return Promise
				.reduce(this.req.body[collectionName] || [], function (entities, item, idx) {
					if (item.eventTypeId && !entities.eventTypes[item.eventTypeId]) {
						return eventTypeDao
							.findByIdAndUser(item.eventTypeId, entities.user)
							.then(function (eventType) {
								entities.eventTypes[item.eventTypeId] = eventType;
								return entities;
							})
							.catch(eventTypeDao.model.NotFoundError, function (err) {
								entities.errors[collectionName][idx] = _.extend(entities.errors[collectionName][idx] || {}, { eventTypeId: [ 'Event type not found.' ]});
								return entities;
							});
					}
					else {
						return entities;
					}
				}, entities);
		});

		return this;
	},

	/**
	 * When present, check the validity of the condition expression. An evaluation
	 * of the expression is done against a given sample event. The result of the
	 * expression evaluation must be true to be considered as a success.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkConditionExpressions: function() {
		this.promise = this.promise.then(function(entities) {
			return Promise
				.reduce(this.req.body.conditions|| [], function(entities, condition, idx) {
					if (condition.fn) {
						// Check if there is the expression and the sample event
						if (!condition.fn.expression || !condition.fn.sampleEvent) {
							entities.errors.conditions[idx] = _.extend(entities.errors.conditions[idx] || {}, { fn: {} });

							// No expression
							if (!condition.fn.expression) {
								entities.errors.conditions[idx].fn.expression = [ 'Expression is mandatory.' ];
							}

							// No sample
							if (!condition.fn.sampleEvent) {
								entities.errors.conditions[idx].fn.sampleEvent = [ 'Sample event is mandatory.' ];
							}
						}
						else {
							try {
								// Retrieve the parameters for the evaluation
								var eventSourceInstance = condition.eventSourceInstanceId ? entities.eventSourceInstances[condition.eventSourceInstanceId] : null;
								var eventType = condition.eventTypeId ? entities.eventTypes[condition.eventTypeId] : null;

								// Evaluation the condition against the sample
								if (!ruleService.evaluateCondition(condition.fn.expression, eventSourceInstance, eventType, condition.fn.sampleEvent)) {
									entities.errors.conditions[idx] = _.extend(entities.errors.conditions[idx] || {}, { fn: { expression: [ 'Sample evaluation against expression returned false.' ] }});
								}
							}
							catch (err) {
								// Syntax or evaluation error
								entities.errors.conditions[idx] = _.extend(entities.errors.conditions[idx] || {}, { fn: { expression: [ 'An error occurred during expression evaluation: ' + err.message ] }});
							}
						}
					}

					return entities;
				}, entities);
		});

		return this;
	},

	/**
	 * Each transformation must define an action target instance. Each action target
	 * instance is retrieved.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkActionTargetInstance: function() {
		this.promise = this.promise.then(function(entities) {
			return Promise
				.reduce(this.req.body.transformations|| [], function (entities, transformation, idx) {
					if (transformation.actionTargetInstanceId && !entities.actionTargetInstances[transformation.actionTargetInstanceId]) {
						return actionTargetInstanceDao
							.findByIdAndUser(transformation.actionTargetInstanceId, entities.user)
							.then(function (actionTargetInstance) {
								entities.actionTargetInstances[transformation.actionTargetInstanceId] = actionTargetInstance;
								return entities;
							})
							.catch(actionTargetInstanceDao.model.NotFoundError, function (err) {
								entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTargetInstanceId: [ 'Action target instance not found.' ]});
								return entities;
							});
					}

					// Action target instance is mandatory
					else if (!transformation.actionTargetInstanceId) {
						entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTargetInstanceId: [ 'Action target instance id is mandatory.' ]});
						return entities;
					}
					else {
						return entities;
					}
				}, entities);
		});

		return this;
	},

	/**
	 * Each transformation must define an action type. Each action type is retrieved.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkActionTypes: function() {
		this.promise = this.promise.then(function (entities) {
			return Promise
				.reduce(this.req.body.transformations|| [], function (entities, transformation, idx) {
					if (transformation.actionTypeId && !entities.actionTypes[transformation.actionTypeId]) {
						return actionTypeDao
							.findByIdAndUser(transformation.actionTypeId, entities.user)
							.then(function (actionType) {
								entities.actionTypes[transformation.actionTypeId] = actionType;
								return entities;
							})
							.catch(actionTypeDao.model.NotFoundError, function (err) {
								entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTypeId: [ 'Action type not found.' ]});
								return entities;
							});
					}

					// Action type is mandatory
					else if (!transformation.actionTypeId) {
						entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTypeId: [ 'Action type id is mandatory.' ]});
						return entities;
					}
					else {
						return entities;
					}
				}, entities);
		});

		return this;
	},

	/**
	 * When present, check the validity of the transformation expression. An evaluation
	 * of the expression is done against a given sample event. The result of the
	 * expression evaluation must return something different from NULL or UNDEFINED.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkTransformationExpressions: function() {
		this.promise = this.promise.then(function(entities) {
			return Promise
				.reduce(this.req.body.transformations|| [], function(entities, transformation, idx) {
					if (transformation.fn) {
						// Check if the expression and the same are present
						if (!transformation.fn.expression || !transformation.fn.sample) {
							entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { fn: {} });

							// No expression
							if (!transformation.fn.expression) {
								entities.errors.transformations[idx].fn.expression = [ 'Expression is mandatory.' ];
							}

							// No sample
							if (!transformation.fn.sample) {
								entities.errors.transformations[idx].fn.sample = [ 'Sample is mandatory.' ];
							}
						}

						// Check if the sample contains an event
						else if (!transformation.fn.sample.event) {
							entities.errors.transformations[idx] = { fn: { sample: { event: [ 'Event is mandatory.' ] }}};
						}
						else {
							// Prepare the evaluation parameters
							var eventSourceInstance = transformation.fn.sample.eventSourceInstanceId ? entities.eventSourceInstances[transformation.fn.sample.eventSourceInstanceId] : null;
							var eventType = transformation.fn.sample.eventTypeId ? entities.eventTypes[transformation.fn.sample.eventTypeId] : null;
							var actionTargetInstance = transformation.actionTargetInstanceID ? entities.actionTargetInstances[transformation.actionTargetInstanceId] : null;
							var actionType = entities.actionTypes[transformation.actionTypeId];

							try {
								// Do the evaluation of the transformation
								var res = ruleService.evaluateTransformation(transformation.fn.expression, actionTargetInstance, actionType, eventSourceInstance, eventType, transformation.fn.sample);

								// The result of evaluation cannot be null or undefined
								if (_.isUndefined(res) || _.isNull(res)) {
									entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { fn: { expression: [ 'Sample evaluation against expression did not return anything.' ] }});
								}
							}
							catch (err) {
								// Syntax or evaluation error
								entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { fn: { expression: [ 'An error occurred during expression evaluation: ' + err.message ] }});
							}
						}
					}

					return entities;
				}, entities);
		});

		return this;
	},

	/**
	 * Apply the multiple checks for the conditions
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkConditions: function() {
		return this
			.checkConditionsIntegrity()
			.checkEventSourceInstances()
			.checkEventTypes('conditions')
			.checkConditionExpressions();
	},

	/**
	 * Apply the multiple checks for the transformations
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkTransformations: function() {
		return this
			.checkActionTargetInstance()
			.checkActionTypes()
			.checkEventTypes('transformations')
			.checkTransformationExpressions();
	},

	/**
	 * Check if there are errors present in the evaluation chain
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkErrors: function() {
		this.promise = this.promise.then(function(entities) {
			var errors = {};

			// Errors for organization
			if (entities.errors.organizationId) {
				errors.organizationId = entities.errors.organizationId;
			}

			// Errors in conditions
			if (_.size(entities.errors.conditions) > 0) {
				errors.conditions = entities.errors.conditions;
			}

			// Errors in transformations
			if (_.size(entities.errors.transformations) > 0) {
				errors.transformations = entities.errors.transformations;
			}

			// Errors present, raise a rule validation error
			if (errors.conditions || errors.transformations || errors.organizationId) {
				throw new RuleValidationError(errors);
			}

			return entities;
		});

		return this;
	},

	/**
	 * Do something in case of success
	 *
	 * @param fn The function to do
	 * @returns {RuleProcessingChain} This
	 */
	success: function(fn) {
		this.promise = this.promise.then(fn);
		return this;
	},

	/**
	 * Do something in case of validation error
	 *
	 * @param fn The function to run in case of error
	 * @returns {RuleProcessingChain} This
	 */
	validationError: function(fn) {
		this.promise = this.promise.catch(RuleValidationError, fn);
		return this;
	}
});

module.exports = {
	RuleValidationError: RuleValidationError,
	RuleProcessingChain: RuleProcessingChain
};
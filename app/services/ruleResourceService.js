var
	_ = require('underscore'),
	moment = require('moment'),
	Promise = require('bluebird'),
	bookshelf = require('../../config/bookshelf'),
	actionTargetDao = require('../persistence/actionTargetDao'),
	actionTypeDao = require('../persistence/actionTypeDao'),
	eventSourceDao = require('../persistence/eventSourceDao'),
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
 * Create dummy event
 *
 * @param eventSource The event source if any
 * @param eventType The event type if any
 * @param properties The properties of the event
 * @returns {Object} The dummy event created
 */
function createDummyEvent(eventSource, eventType, properties) {
	var event = {
		timestamp: moment.utc().format(),
		properties: properties
	};

	if (eventSource) {
		event = _.extend(event, {
			eventSourceId: eventSource.get('eventSourceId')
		});
	}

	if (eventType) {
		event = _.extend(event, {
			eventType: eventType.get('type')
		});
	}

	return event;
}

/**
 * Extract the different ids from a rule (conditions, transformations)
 *
 * @param rule The rule where to do the extraction
 * @returns {{actionTypes: Array, actionTargets: Array, transformationEventTypes: Array, conditionEventTypes: Array, eventSources: Array}} The ids extracted
 */
function extractIds(rule) {
	var ids = {
		actionTypes: [],
		actionTargets: [],
		transformationEventTypes: [],
		eventSources: [],
		conditionEventTypes: []
	};

	_.each(rule.get('conditions'), function(condition) {
		if (condition.eventSource && condition.eventSource.id && !_.contains(ids.eventSources, condition.eventSource.id)) {
			ids.eventSources.push(condition.eventSource.id);
		}
	});

	_.each(rule.get('conditions'), function(condition) {
		if (condition.eventType && condition.eventType.id && !_.contains(ids.conditionEventTypes, condition.eventType.id)) {
			ids.conditionEventTypes.push(condition.eventType.id);
		}
	});

	_.each(rule.get('transformations'), function(condition) {
		if (condition.actionTarget && condition.actionTarget.id && !_.contains(ids.actionTargets, condition.actionTarget.id)) {
			ids.actionTargets.push(condition.actionTarget.id);
		}
	});

	_.each(rule.get('transformations'), function(condition) {
		if (condition.actionType && condition.actionType.id && !_.contains(ids.actionTypes, condition.actionType.id)) {
			ids.actionTypes.push(condition.actionType.id);
		}
	});

	_.each(rule.get('transformations'), function(condition) {
		if (condition.eventType && condition.eventType.id && !_.contains(ids.transformationEventTypes, condition.eventType.id)) {
			ids.transformationEventTypes.push(condition.eventType.id);
		}
	});

	ids.conditionAndTransformationEventTypes = _.intersection(ids.conditionEventTypes, ids.transformationEventTypes);
	ids.conditionEventTypes = _.difference(ids.conditionEventTypes, ids.conditionAndTransformationEventTypes);
	ids.transformationEventTypes = _.difference(ids.transformationEventTypes, ids.conditionAndTransformationEventTypes);

	return ids;
}

/**
 * Rule processing chain
 *
 * @param req The request to get the data for various validations and data collection
 * @param collectionRequired Define if the collection are mandatory or not
 * @constructor
 */
function RuleProcessingChain(req, collectionRequired) {
	this.req = req;

	this.entities = {
		actionTargets: {},
		eventSources: {},
		eventTypes: {},
		actionTypes: {},
		errors: {
			conditions: {},
			transformations: {}
		},
		user: req.userModel
	};

	// Initialize the validation chain for the rules validation.
	// This function is aimed to be used in POST and PATCH methods.
	this.promise = Promise
		.resolve(this.entities)
		.bind(this);

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
					if (!condition.eventSourceId && !condition.eventTypeId && !condition.fn) {
						entities.errors.conditions[idx] = [ 'At least one of eventSourceId, eventTypeId or fn must be provided.' ];
					}

					return entities;
				}, entities);
		});

		return this;
	},

	/**
	 * When present, retrieve the event source from its id. This is done
	 * for each condition present in the rule.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkEventSources: function() {
		this.promise = this.promise.then(function(entities) {
			return Promise
				.reduce(this.req.body.conditions|| [], function (entities, condition, idx) {
					if (condition.eventSourceId && !entities.eventSources[condition.eventSourceId]) {
						return eventSourceDao
							.findByIdAndUserOrPublic(condition.eventSourceId, entities.user)
							.then(function (eventSource) {
								entities.eventSources[condition.eventSourceId] = eventSource;
								return entities;
							})
							.catch(eventSourceDao.model.NotFoundError, function (err) {
								entities.errors.conditions[idx] = _.extend(entities.errors.conditions[idx] || {}, {eventSourceId: ['Event source not found.']});
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
							.findByIdAndUserOrPublic(item.eventTypeId, entities.user)
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
								var eventSource = condition.eventSourceId ? entities.eventSources[condition.eventSourceId] : null;
								var eventType = condition.eventTypeId ? entities.eventTypes[condition.eventTypeId] : null;

								// Evaluation the condition against the sample
								if (!ruleService.evaluateCondition(condition.fn.expression, eventSource, eventType, createDummyEvent(eventSource, eventType, condition.fn.sampleEvent))) {
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
	 * Each transformation must define an action target. Each action target is retrieved.
	 *
	 * @returns {RuleProcessingChain} This
	 */
	checkActionTargets: function() {
		this.promise = this.promise.then(function(entities) {
			return Promise
				.reduce(this.req.body.transformations|| [], function (entities, transformation, idx) {
					if (transformation.actionTargetId && !entities.actionTargets[transformation.actionTargetId]) {
						return actionTargetDao
							.findByIdAndUserOrPublic(transformation.actionTargetId, entities.user)
							.then(function (actionTarget) {
								entities.actionTargets[transformation.actionTargetId] = actionTarget;
								return entities;
							})
							.catch(actionTargetDao.model.NotFoundError, function (err) {
								entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTargetId: [ 'Action target not found.' ]});
								return entities;
							});
					}

					// Action target is mandatory
					else if (!transformation.actionTargetId) {
						entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTargetId: [ 'Action target id is mandatory.' ]});
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
							.findByIdAndUserOrPublic(transformation.actionTypeId, entities.user)
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
							var eventSource = transformation.fn.sample.eventSourceId ? entities.eventSources[transformation.fn.sample.eventSourceId] : null;
							var eventType = transformation.fn.sample.eventTypeId ? entities.eventTypes[transformation.fn.sample.eventTypeId] : null;
							var actionTarget = transformation.actionTargetId ? entities.actionTargets[transformation.actionTargetId] : null;
							var actionType = entities.actionTypes[transformation.actionTypeId];

							try {
								// Do the evaluation of the transformation
								var res = ruleService.evaluateTransformation(transformation.fn.expression, actionTarget, actionType, eventSource, eventType, createDummyEvent(eventSource, eventType, transformation.fn.sample.event));

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
			.checkEventSources()
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
			.checkActionTargets()
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
	 * Do something in case of create success
	 *
	 * @param fn The function to do
	 * @returns {RuleProcessingChain} This
	 */
	successCreate: function(fn) {
		this.promise = this.promise.then(function(entities) {
			return bookshelf.transaction(function (t) {
				var transactionPromise = Promise.resolve();

				/**
				 * The following loops will update the ref counts for the different models used by the rule. The ref count
				 * is updated only once for each model even if it is present multiple times in the rule.
				 */

				_.each(entities.actionTargets, function(actionTarget) {
					actionTarget.set('refCount', actionTarget.get('refCount') + 1);
					transactionPromise = transactionPromise.then(actionTarget.save(null, { transacting: t }));
				});

				_.each(entities.eventSources, function(eventSource) {
					eventSource.set('refCount', eventSource.get('refCount') + 1);
					transactionPromise = transactionPromise.then(eventSource.save(null, { transacting: t }));
				});

				_.each(entities.eventTypes, function(eventType) {
					eventType.set('refCount', eventType.get('refCount') + 1);
					transactionPromise = transactionPromise.then(eventType.save(null, { transacting: t }));
				});

				_.each(entities.actionTypes, function(actionType) {
					actionType.set('refCount', actionType.get('refCount') + 1);
					transactionPromise = transactionPromise.then(actionType.save(null, { transacting: t }));
				});

				return transactionPromise
					.then(function() {
						return { entities: entities, t: t };
					})
					.then(fn);
			})
			.then(function() {
				return entities;
			})
		});

		return this;
	},

	/**
	 * Do something in case of update success
	 *
	 * @param rule The rule before update
	 * @param fn The function to do
	 * @returns {RuleProcessingChain} This
	 */
	successUpdate: function(payload, rule, fn) {
		this.promise = this.promise.then(function(entities) {
			return bookshelf.transaction(function (t) {
				var transactionPromise = Promise.resolve();

				var gatheredIds = extractIds(rule);

				/**
				 * All the following checks aims to reach the goal to update the ref count of the diffrent models
				 * used by the rules only once per rule. For example, if an event type is used by 2 conditions and 1 transformation,
				 * the ref count for this event type will be incremented only by 1 for this rule.
				 */

				// Check if the transformations are updated
				if (payload.transformations) {
					// Reset the count for all the action targets of the rule before update
					_.each(gatheredIds.actionTargets, function (actionTargetId) {
						transactionPromise = transactionPromise.then(function () {
							return actionTargetDao
								.findById(actionTargetId)
								.then(function (actionTargetFound) {
									actionTargetFound.set('refCount', actionTargetFound.get('refCount') - 1);
									return actionTargetFound.save(null, {transacting: t})
								})
						});
					});

					// Reset the count for all the action types of the rule before update
					_.each(gatheredIds.actionTypes, function (actionTypeId) {
						transactionPromise = transactionPromise.then(function () {
							return actionTypeDao
								.findById(actionTypeId)
								.then(function (actionTypeFound) {
									actionTypeFound.set('refCount', actionTypeFound.get('refCount') - 1);
									return actionTypeFound.save(null, {transacting: t})
								})
						});
					});

					// Reset the count for all the event types used only by transformations of the rule before update
					_.each(gatheredIds.transformationEventTypes, function (eventTypeId) {
						transactionPromise = transactionPromise.then(function () {
							return eventTypeDao
								.findById(eventTypeId)
								.then(function (eventTypeFound) {
									eventTypeFound.set('refCount', eventTypeFound.get('refCount') - 1);
									return eventTypeFound.save(null, {transacting: t})
								})
						});
					});
				}

				// Check if the conditions are updated
				if (payload.conditions) {
					// Reset the count for all the event sources of the rule before update
					_.each(gatheredIds.eventSources, function (eventSourceId) {
						transactionPromise = transactionPromise.then(function () {
							return eventSourceDao
								.findById(eventSourceId)
								.then(function (eventSourceFound) {
									eventSourceFound.set('refCount', eventSourceFound.get('refCount') - 1);
									return eventSourceFound.save(null, {transacting: t})
								})
						});
					});

					// Reset the count for all the event types only present in conditions of the rule before update
					_.each(gatheredIds.conditionEventTypes, function (eventTypeId) {
						transactionPromise = transactionPromise.then(function () {
							return eventTypeDao
								.findById(eventTypeId)
								.then(function (eventTypeFound) {
									eventTypeFound.set('refCount', eventTypeFound.get('refCount') - 1);
									return eventTypeFound.save(null, {transacting: t})
								})
						});
					});
				}

				// Check if the conditions and transformations are updated
				if (payload.conditions && payload.transformations) {
					// Reset the count for all the event types present both in conditions and transformations of the rule before update
					_.each(gatheredIds.conditionAndTransformationEventTypes, function (eventTypeId) {
						transactionPromise = transactionPromise.then(function () {
							return eventTypeDao
								.findById(eventTypeId)
								.then(function (eventTypeFound) {
									eventTypeFound.set('refCount', eventTypeFound.get('refCount') - 1);
									return eventTypeFound.save(null, {transacting: t})
								})
						});
					});
				}

				// Check if the transformations are updated
				if (payload.transformations) {
					// Update the ref counts for action targets
					_.each(entities.actionTargets, function (actionTarget) {
						actionTarget.set('refCount', actionTarget.get('refCount') + 1);
						transactionPromise = transactionPromise.then(actionTarget.save(null, {transacting: t}));
					});

					// Update the ref counts for action types
					_.each(entities.actionTypes, function (actionType) {
						actionType.set('refCount', actionType.get('refCount') + 1);
						transactionPromise = transactionPromise.then(actionType.save(null, {transacting: t}));
					});
				}

				// Check if the conditions are updated
				if (payload.conditions) {
					// Update the ref counts for event sources
					_.each(entities.eventSources, function (eventSource) {
						eventSource.set('refCount', eventSource.get('refCount') + 1);
						transactionPromise = transactionPromise.then(eventSource.save(null, {transacting: t}));
					});
				}

				// Check if the condition or transformations are updated
				if (payload.conditions || payload.transformations) {
					_.each(entities.eventTypes, function (eventType) {
						// Update the ref counts for event types if transformations and conditions are updated, or if conditions
						// are updated but the event type not already present in transformations, or if transformations are updated
						// but the event type not already present in conditions. It will ensure to update the ref count only once
						// for an event type used multiple times in a rule.
						if (
							(payload.conditions && payload.transformations) ||
							(payload.conditions && !_.contains(gatheredIds.conditionAndTransformationEventTypes, eventType.get('id'))) ||
							(payload.transformations && !_.contains(gatheredIds.conditionAndTransformationEventTypes, eventType.get('id')))
						) {
							eventType.set('refCount', eventType.get('refCount') + 1);
							transactionPromise = transactionPromise.then(eventType.save(null, {transacting: t}));
						}
					});
				}

				return transactionPromise
					.then(function() {
						return { entities: entities, t: t };
					})
					.then(fn);
			})
			.then(function() {
				return entities;
			})
		});

		return this;
	},

	/**
	 * Do something in case of delete success
	 *
	 * @param rule The rule before delete
	 * @param fn The function to do
	 * @returns {RuleProcessingChain} This
	 */
	successDelete: function(rule, fn) {
		this.promise = this.promise.then(function(entities) {
			return bookshelf.transaction(function (t) {
				var transactionPromise = Promise.resolve();

				var gatheredIds = extractIds(rule);

				/**
				 * When a rule is deleted, we need to reset the ref count of the models used by the rule. For that,
				 * we gathered each model id only once to reduce the ref count of this model by one. We enforce this
				 * ref count update to be done only once per model even if it is used multiple times by a rule.
				 */

				_.each(gatheredIds.actionTargets, function(actionTargetId) {
					transactionPromise = transactionPromise.then(function() {
						return actionTargetDao
							.findById(actionTargetId)
							.then(function(actionTargetFound) {
								actionTargetFound.set('refCount', actionTargetFound.get('refCount') - 1);
								return actionTargetFound.save(null, { transacting: t })
							})
					});
				});

				_.each(gatheredIds.eventSources, function(eventSourceId) {
					transactionPromise = transactionPromise.then(function() {
						return eventSourceDao
							.findById(eventSourceId)
							.then(function(eventSourceFound) {
								eventSourceFound.set('refCount', eventSourceFound.get('refCount') - 1);
								return eventSourceFound.save(null, { transacting: t })
							})
					});
				});

				_.each(_.union(gatheredIds.conditionEventTypes, gatheredIds.conditionAndTransformationEventTypes, gatheredIds.transformationEventTypes), function(eventTypeId) {
					transactionPromise = transactionPromise.then(function() {
						return eventTypeDao
							.findById(eventTypeId)
							.then(function(eventTypeFound) {
								eventTypeFound.set('refCount', eventTypeFound.get('refCount') - 1);
								return eventTypeFound.save(null, { transacting: t })
							})
					});
				});

				_.each(gatheredIds.actionTypes, function(actionTypeId) {
					transactionPromise = transactionPromise.then(function() {
						return actionTypeDao
							.findById(actionTypeId)
							.then(function(actionTypeFound) {
								actionTypeFound.set('refCount', actionTypeFound.get('refCount') - 1);
								return actionTypeFound.save(null, { transacting: t })
							})
					});
				});

				return transactionPromise
					.then(function() {
						return { t: t };
					})
					.then(fn);
			})
			.then(function() {
				return entities;
			})
		});

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
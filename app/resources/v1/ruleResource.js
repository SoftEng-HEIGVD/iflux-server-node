var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	Promise = require('bluebird'),
	safeEval = require('notevil'),
	ValidationError = require('checkit').Error,
	Handlebars = require('handlebars'),
	Rule = require('../../services/modelRegistry').rule,
	actionTargetInstanceDao = require('../../persistence/actionTargetInstanceDao'),
	actionTypeDao = require('../../persistence/actionTypeDao'),
	eventSourceInstanceDao = require('../../persistence/eventSourceInstanceDao'),
	eventTypeDao = require('../../persistence/eventTypeDao'),
	organizationDao = require('../../persistence/organizationDao'),
	ruleDao = require('../../persistence/ruleDao'),
	ruleConverter = require('../../converters/ruleConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/rules');

module.exports = function (app) {
	app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return ruleDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(rule) {
				req.rule = rule;
				next();
			})
			.catch(ruleDao.model.NotFoundError, function(err) {
				return resourceService.forbidden(res).end();
			});
	});
};

function RuleValidationError(errors) {
  this.name = 'RuleValidationError';
  this.message = 'Rule validation errors';
	this.errors = errors;
}

RuleValidationError.prototype = Object.create(Error.prototype);
RuleValidationError.prototype.constructor = RuleValidationError;

function evaluateCondition(expression, eventSourceInstance, eventType, sample) {
	var fn = safeEval.Function('event', 'eventSourceInstance', 'eventType', expression);

	return fn(sample, eventSourceInstance, eventType);
}

function evaluateTransformation(expression, actionTargetInstance, actionType, eventSourceInstance, eventType, sample) {
	var fn = safeEval.Function('event', 'actionTargetInstance', 'actionType', 'eventSourceInstance', 'eventType', expression);

	return fn(sample, actionTargetInstance, actionType, eventSourceInstance, eventType);
}

function initCheckChain() {
	return Promise
		.resolve({
			actionTargetInstances: {},
			eventSourceInstances: {},
			eventTypes: {},
			actionTypes: {},
			errors: {
				conditions: {},
				transformations: {}
			}
		});
}

function checkConditionsIntegrity(req) {
	return function(entities) {
		return Promise
			.reduce(req.body.conditions, function (entities, condition, idx) {
				if (!condition.eventSourceInstanceId && !condition.eventTypeId && !condition.fn) {
					entities.errors.conditions[idx] = [ 'At least one of eventSourceInstanceId, eventTypeId or fn must be provided.' ];
				}

				return entities;
			}, entities);
	};
}

function checkEventSourceInstances(req) {
	return function(entities) {
		return Promise
			.reduce(req.body.conditions, function (entities, condition, idx) {
				if (condition.eventSourceInstanceId && !entities.eventSourceInstances[condition.eventSourceInstanceId]) {
					return eventSourceInstanceDao
						.findByIdAndUser(condition.eventSourceInstanceId, req.userModel)
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
	};
}

function checkEventTypes(req, collectionName) {
	return function (entities) {
		return Promise
			.reduce(req.body[collectionName], function (entities, item, idx) {
				if (item.eventTypeId && !entities.eventTypes[item.eventTypeId]) {
					return eventTypeDao
						.findByIdAndUser(item.eventTypeId, req.userModel)
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
	};
}

function checkConditions(req) {
	return function(entities) {
		return Promise
			.reduce(req.body.conditions, function(entities, condition, idx) {
				if (condition.fn) {
					if (!condition.fn.expression || !condition.fn.sampleEvent) {
						entities.errors.conditions[idx] = _.extend(entities.errors.conditions[idx] || {}, { fn: {} });

						if (!condition.fn.expression) {
							entities.errors.conditions[idx].fn.expression = [ 'Expression is mandatory.' ];
						}

						if (!condition.fn.sampleEvent) {
							entities.errors.conditions[idx].fn.sampleEvent = [ 'Sample event is mandatory.' ];
						}
					}
					else {
						try {
							var eventSourceInstance = condition.eventSourceInstanceId ? entities.eventSourceInstances[condition.eventSourceInstanceId] : null;
							var eventType = condition.eventTypeId ? entities.eventTypes[condition.eventTypeId] : null;

							if (!evaluateCondition(condition.fn.expression, eventSourceInstance, eventType, condition.fn.sampleEvent)) {
								entities.errors.conditions[idx] = _.extend(entities.errors.conditions[idx] || {}, { fn: { expression: [ 'Sample evaluation against expression returned false.' ] }});
							}
						}
						catch (err) {
							entities.errors.conditions[idx] = _.extend(entities.errors.conditions[idx] || {}, { fn: { expression: [ 'An error occurred during expression evaluation: ' + err.message ] }});
						}
					}
				}

				return entities;
			}, entities);
	};
}

function checkActionTargetInstance(req) {
	return function(entities) {
		return Promise
			.reduce(req.body.transformations, function (entities, condition, idx) {
				if (condition.actionTargetInstanceId && !entities.actionTargetInstances[condition.actionTargetInstanceId]) {
					return actionTargetInstanceDao
						.findByIdAndUser(condition.actionTargetInstanceId, req.userModel)
						.then(function (actionTargetInstance) {
							entities.actionTargetInstances[condition.actionTargetInstanceId] = actionTargetInstance;
							return entities;
						})
						.catch(actionTargetInstanceDao.model.NotFoundError, function (err) {
							entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTargetInstanceId: [ 'Action target instance not found.' ]});
							return entities;
						});
				}
				else if (condition.actionTargetInstanceId) {
					entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTargetInstanceId: [ 'Action target instance id is mandatory.' ]});
					return entities;
				}
				else {
					return entities;
				}
			}, entities);
	};
}

function checkActionTypes(req) {
	return function (entities) {
		return Promise
			.reduce(req.body.transformations, function (entities, transformation, idx) {
				if (transformation.actionTypeId && !entities.actionTypes[transformation.actionTypeId]) {
					return actionTypeDao
						.findByIdAndUser(transformation.actionTypeId, req.userModel)
						.then(function (actionType) {
							entities.actionTypes[transformation.actionTypeId] = actionType;
							return entities;
						})
						.catch(eventTypeDao.model.NotFoundError, function (err) {
							entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { actionTypeId: [ 'Action type not found.' ]});
							return entities;
						});
				}
				else {
					return entities;
				}
			}, entities);
	};
}

function checkTransformations(req) {
	return function(entities) {
		return Promise
			.reduce(req.body.transformations, function(entities, transformation, idx) {
				if (transformation.fn) {
					if (!transformation.fn.expression || !transformation.fn.sample) {
						entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { fn: {} });

						if (!transformation.fn.expression) {
							entities.errors.transformations[idx].fn.expression = [ 'Expression is mandatory.' ];
						}

						if (!transformation.fn.sample) {
							entities.errors.transformations[idx].fn.sample = [ 'Sample is mandatory.' ];
						}
					}
					else if (!transformation.fn.sample.event) {
						entities.errors.transformations[idx] = { fn: { sample: { event: [ 'Event is mandatory.' ] }}};
					}
					else {
						var eventSourceInstance = transformation.fn.sample.eventSourceInstanceId ? entities.eventSourceInstances[transformation.fn.sample.eventSourceInstanceId] : null;
						var eventType = transformation.fn.sample.eventTypeId ? entities.eventTypes[transformation.fn.sample.eventTypeId] : null;
						var actionTargetInstance = transformation.actionTargetInstanceID ? entities.actionTargetInstances[transformation.actionTargetInstanceId] : null;
						var actionType = entities.actionTypes[transformation.actionTypeId];

						try {
							var res = evaluateTransformation(transformation.fn.expression, actionTargetInstance, actionType, eventSourceInstance, eventType, transformation.fn.sample);
							if (_.isUndefined(res) || _.isNull(res)) {
								entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { fn: { expression: [ 'Sample evaluation against expression did not return anything.' ] }});
							}
						}
						catch (err) {
							entities.errors.transformations[idx] = _.extend(entities.errors.transformations[idx] || {}, { fn: { expression: [ 'An error occurred during expression evaluation: ' + err.message ] }});
						}
					}
				}

				return entities;
			}, entities);
	};
}

function checkErrors(res, next) {
	return function(entities) {
		var errors = {};

		if (_.size(entities.errors.conditions) > 0) {
			errors.conditions = entities.errors.conditions;
		}

		if (_.size(entities.errors.transformations) > 0) {
			errors.transformations = entities.errors.transformations;
		}

		if (errors.conditions || errors.transformations) {
			throw new RuleValidationError(errors);
		}

		return entities;
	}
}

function populateConditions(entities, rule, conditions) {
	_.each(conditions, function(condition) {
		var realCondition = { description: condition.description ? condition.description : null };

		if (condition.eventSourceInstanceId) {
			var eventSourceInstance = entities.eventSourceInstances[condition.eventSourceInstanceId];

			realCondition = _.extend(realCondition, {
				eventSourceInstanceId: eventSourceInstance.get('id'),
				eventSourceInstanceKey: eventSourceInstance.get('eventSourceInstanceId')
			});
		}

		if (condition.eventTypeId) {
			var eventType = entities.eventTypes[condition.eventTypeId];

			realCondition = _.extend(realCondition, {
				eventTypeId: eventType.get('id'),
				eventTypeKey: eventType.get('eventTypeId')
			});
		}

		if (condition.fn) {
			realCondition = _.extend(realCondition, {
				fn: condition.fn.expression,
				sampleEvent: condition.fn.sampleEvent
			});
		}

		rule.conditions.push(realCondition);
	});
}

function populateTransformations(entities, rule, transformations) {
	_.each(transformations, function(transformation) {
		var realTransformation = { description: transformation.description ? transformation.description : null };

		var actionTargetInstance = entities.actionTargetInstances[transformation.actionTargetInstanceId];

		realTransformation = _.extend(realTransformation, {
			actionTargetInstanceId: actionTargetInstance.get('id'),
			actionTargetInstanceKey: actionTargetInstance.get('actionTargetInstanceId')
		});

		var actionType = entities.actionTypes[transformation.actionTypeId];

		realTransformation = _.extend(realTransformation, {
			actionTypeId: actionType.get('id'),
			actionTypeKey: actionType.get('actionTypeId')
		});

		if (transformation.eventTypeId) {
			var eventType = entities.eventTypes[transformation.eventTypeId];

			realTransformation = _.extend(realTransformation, {
				eventTypeId: eventType.get('id'),
				eventTypeKey: eventType.get('eventTypeId')
			});
		}

		if (transformation.fn) {
			realTransformation = _.extend(realTransformation, {
				fn: transformation.fn.expression,
				sampleEvent: transformation.fn.sample.event
			});

			if (transformation.fn.sample.eventSourceTemplateId) {
				realTransformation.sampleEventSourceTemplateId = transformation.fn.sample.eventSourceTemplateId;
			}

			if (transformation.fn.sample.eventTypeId) {
				realTransformation.eventTypeId = transformation.fn.sample.eventTypeId;
			}
		}

		rule.transformations.push(realTransformation);
	});
}

function createRuleDefinition(mode, entities, req) {
	var ruleDefinition = {};

	if (req.body.name) {
		ruleDefinition.name = req.body.name;
	}

	if (req.body.description) {
		ruleDefinition.description = req.body.description;
	}

	if (mode == 'post' || req.body.active) {
		ruleDefinition.active = _.isUndefined(req.body.active) ? true : req.body.active;
	}
	else if (req.body.active) {
		ruleDefinition.active = req.body.active;
	}

	if (mode == 'post' || req.body.conditions) {
		ruleDefinition.conditions = [];
		populateConditions(entities, ruleDefinition, req.body.conditions);
	}

	if (mode == 'post' || req.body.transformations) {
		ruleDefinition.transformations = [];
		populateTransformations(entities, ruleDefinition, req.body.transformations);
	}

	return ruleDefinition;
}

router.route('/')
	/**
	 * GET /rules is invoked to get the list of all rules.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.get(function(req, res, next) {
		if (req.query.organizationId) {
			return organizationDao
				.findByIdAndUser(req.query.organizationId, req.userModel)
				.then(function(organization) {
					req.organization = organization;
					return next();
				})
				.catch(organizationDao.model.NotFoundError, function(err) {
					return resourceService.forbidden(res).end();
				});
		}
		else {
			return next();
		}
	})
	.get(function(req, res, next) {
		var promise = null;

		if (req.organization) {
			promise = ruleDao.findByOrganization(req.organization);
		}
		else {
			promise = ruleDao.findAllByUser(req.userModel);
		}

		promise
			.then(function(rules) {
				return resourceService.ok(res,
					_.map(rules, function(rule) {
						return ruleConverter.convert(rule);
					})
				);
			})
			.then(null, function(err) {
				return next(err);
			});
	})

	/**
	 * POST /rules is invoked by clients to create a new rule.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.post(function(req, res, next) {
		if (req.body.organizationId) {
			return organizationDao
				.findByIdAndUser(req.body.organizationId, req.userModel)
				.then(function(organization) {
					req.organization = organization;
					return next();
				})
				.catch(organizationDao.model.NotFoundError, function(err) {
					return resourceService.validationError(res, { organizationId: [ 'Organization not found.' ]}).end();
				});
		}
		else {
			return resourceService.validationError(res, { organizationId: [ 'Field organizationId is mandatory.' ]}).end();
		}
	})
	.post(function(req, res, next) {
		var errors = {};

		// Check there is at least one condition
		if (_.isUndefined(req.body.conditions) || req.body.conditions.length == 0) {
			errors.conditions = [ 'At least one condition must be defined.' ];
		}

		// Check there is at least one transformation
		if (_.isUndefined(req.body.transformations) || req.body.transformations.length == 0) {
			errors.transformations = [ 'At least one transformation must be defined.' ];
		}

		// Check if there is errors
		if (_.size(errors) > 0) {
			return resourceService.validationError(res, errors).end();
		}

		// Process additional checks
		else {
			return initCheckChain()
				.then(checkConditionsIntegrity(req))
				.then(checkEventSourceInstances(req))
				.then(checkEventTypes(req, 'conditions'))
				.then(checkConditions(req))
				.then(checkActionTargetInstance(req))
				.then(checkActionTypes(req))
				.then(checkEventTypes(req, 'transformations'))
				.then(checkTransformations(req))
				.then(checkErrors(res, next))
				.then(function (entities) {
					var newRuleDefinition = createRuleDefinition('post', entities, req);

					return ruleDao
						.createAndSave(newRuleDefinition, req.organization)
						.then(function(ruleSaved) {
							return resourceService.location(res, 201, ruleSaved).end();
						})
						.catch(ValidationError, function(e) {
							return resourceService.validationError(res, e);
						})
						.error(function(err) {
							if (err.stack(err)) {
								console.log(err.stack);
							}
							return next(err)
						});
				})
				.catch(RuleValidationError, function(e) {
					if (e.stack) {
						console.log(e.stack);
					}
					return resourceService.validationError(res, e.errors);
				});
		}
	});

router.route('/:id')
	/**
	 * GET /rules is invoked by clients to retrieve a rule.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.get(function(req, res, next) {
		return resourceService.ok(res, ruleConverter.convert(req.rule));;
	})

	/**
	 * PATCH /rules/:id is invoked by clients to update part of a rule.
	 * The body of the request is a partial single rule, defined by a source, an event type,
	 * a target and. The target is the root the API exposed by an iFLUX action
	 * target (e.g. http://gateway.org/api/).
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.patch(function(req, res, next) {
		var errors = {};

		// Check there is at least one condition
		if (req.body.conditions && req.body.conditions.length == 0) {
			errors.conditions = [ 'At least one condition must be defined.' ];
		}

		// Check there is at least one transformation
		if (req.body.transformations && req.body.transformations.length == 0) {
			errors.transformations = [ 'At least one transformation must be defined.' ];
		}

		// Check if there is errors
		if (_.size(errors) > 0) {
			return resourceService.validationError(res, errors).end();
		}

		// Process additional checks
		else {
			var promise = initCheckChain();

			if (req.body.conditions) {
				promise = promise
					.then(checkConditionsIntegrity(req))
					.then(checkEventSourceInstances(req))
					.then(checkEventTypes(req, 'conditions'))
					.then(checkConditions(req));
			}

			if (req.body.transformations) {
				promise = promise
					.then(checkActionTargetInstance(req))
					.then(checkActionTypes(req))
					.then(checkEventTypes(req, 'transformations'))
					.then(checkTransformations(req));
			}

			promise
				.then(checkErrors(res, next))
				.then(function (entities) {
					var updatedRuleDefinition = createRuleDefinition('patch', entities, req);

					var rule = req.rule;

					if (updatedRuleDefinition.name) {
						rule.set('name', updatedRuleDefinition.name);
					}

					if (updatedRuleDefinition.description) {
						rule.set('description', updatedRuleDefinition.description);
					}

					if (updatedRuleDefinition.active) {
						rule.set('active', updatedRuleDefinition.active);
					}

					if (!_.isEmpty(updatedRuleDefinition.conditions)) {
						rule.set('conditions', updatedRuleDefinition.conditions);
					}

					if (!_.isEmpty(updatedRuleDefinition.transformations)) {
						rule.set('transformations', updatedRuleDefinition.transformations);
					}

					if (rule.hasChanged()) {
						return ruleDao
							.save(rule)
							.then(function() {
								return resourceService.location(res, 201, rule).end();
							})
							.catch(ValidationError, function(e) {
								return resourceService.validationError(res, e);
							});
					}
					else {
						return resourceService.location(res, 304, rule).end();
					}
				})
				.catch(RuleValidationError, function(e) {
					if (e.stack) {
						console.log(e.stack);
					}
					return resourceService.validationError(res, e.errors);
				});
		}
	})

	/**
	 * DELETE /rules/:id is invoked to delete one rule, identified by its unique id.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.delete(function(req, res, next) {
		return req.rule
			.destroy()
			.then(function() {
				return resourceService.deleted(res).end();
			})
			.error(function(err) {
				if (err.stack) {
					console.log(err.stack);
				}

				return resourceService.serverError(res, { message: err.message }).end();
			});
	});

var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
	Promise = require('bluebird'),
	ValidationError = require('checkit').Error,
	Handlebars = require('handlebars'),
	Rule = require('../../services/modelRegistry').rule,
	organizationDao = require('../../persistence/organizationDao'),
	ruleDao = require('../../persistence/ruleDao'),
	ruleConverter = require('../../converters/ruleConverter'),
	ruleResourceService = require('../../services/ruleResourceService'),
	ruleEngineService = require('../../services/ruleEngineService'),
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

/**
 * From the data collected and checked, build a condition array with
 * valid data ready to be persisted.
 *
 * @param entities The data collected through the check chain
 * @param rule The rule to enrich
 * @param conditions The conditions
 */
function populateConditions(entities, rule, conditions) {
	_.each(conditions, function(condition) {
		// Base condition
		var realCondition = { description: condition.description ? condition.description : null };

		// Event source present
		if (condition.eventSourceId) {
			var eventSource = entities.eventSources[condition.eventSourceId];

			// Store id + generated string id
			realCondition = _.extend(realCondition, {
				eventSource: {
					id: eventSource.get('id'),
					generatedIdentifier: eventSource.get('generatedIdentifier')
				}
			});
		}

		// Event type present
		if (condition.eventTypeId) {
			var eventType = entities.eventTypes[condition.eventTypeId];

			// Store id + generated string id
			realCondition = _.extend(realCondition, {
				eventType: {
					id: eventType.get('id'),
					type: eventType.get('type')
				}
			});
		}

		// Expression present
		if (condition.fn) {
			// Store expression and sample event
			realCondition = _.extend(realCondition, {
				fn: condition.fn.expression,
				sampleEvent: condition.fn.sampleEvent
			});
		}

		// Collect condition
		rule.conditions.push(realCondition);
	});
}

function populateTransformations(entities, rule, transformations) {
	_.each(transformations, function(transformation) {
		var realTransformation = { description: transformation.description ? transformation.description : null };

		var actionTarget = entities.actionTargets[transformation.actionTargetId];

		realTransformation = _.extend(realTransformation, {
			actionTarget: {
				id: actionTarget.get('id'),
				generatedIdentifier: actionTarget.get('generatedIdentifier')
			}
		});

		var actionType = entities.actionTypes[transformation.actionTypeId];

		realTransformation = _.extend(realTransformation, {
			actionType: {
				id: actionType.get('id'),
				type: actionType.get('type')
			}
		});

		if (transformation.eventTypeId) {
			var eventType = entities.eventTypes[transformation.eventTypeId];

			realTransformation = _.extend(realTransformation, {
				eventType: {
					id: eventType.get('id'),
					type: eventType.get('type')
				}
			});
		}

		if (transformation.fn) {
			realTransformation = _.extend(realTransformation, {
				fn: transformation.fn.expression,
				sampleEvent: transformation.fn.sample.event
			});

			if (transformation.fn.sample.eventSourceId) {
				realTransformation.sampleEventSourceId = transformation.fn.sample.eventSourceId;
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
			promise = ruleDao.findByOrganization(req.organization, { name: req.query.name });
		}
		else {
			promise = ruleDao.findAllByUser(req.userModel, { name: req.query.name });
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
		return new ruleResourceService.RuleProcessingChain(req, true)
			.checkOrganization()
			.checkConditions()
			.checkTransformations()
			.checkErrors()
			.success(function (entities) {
				var newRuleDefinition = createRuleDefinition('post', entities, req);

				return ruleDao
					.createAndSave(newRuleDefinition, entities.organization)
					.then(function(ruleSaved) { return ruleEngineService.populate(ruleSaved); })
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
			.validationError(function(e) {
				if (e.stack) {
					npmlog.info(e);
				}
				return resourceService.validationError(res, e.errors);
			});
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
		var ruleProcessingChain = new ruleResourceService.RuleProcessingChain(req, false);

		if (req.body.conditions) {
			ruleProcessingChain = ruleProcessingChain
				.checkConditionsIntegrity()
				.checkEventSources()
				.checkEventTypes('conditions')
				.checkConditions();
		}

		if (req.body.transformations) {
			ruleProcessingChain = ruleProcessingChain
				.checkActionTargets()
				.checkActionTypes()
				.checkEventTypes('transformations')
				.checkTransformations();
		}

		ruleProcessingChain
			.checkErrors()
			.success(function (entities) {
				var updatedRuleDefinition = createRuleDefinition('patch', entities, req);

				var rule = req.rule;

				if (updatedRuleDefinition.name) {
					rule.set('name', updatedRuleDefinition.name);
				}

				if (updatedRuleDefinition.description) {
					rule.set('description', updatedRuleDefinition.description);
				}

				if (!_.isUndefined(updatedRuleDefinition.active)) {
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
						.then(function() { return ruleEngineService.populate(); })
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
			.validationError(function(e) {
				if (e.stack) {
					npmlog.info(e);
				}
				return resourceService.validationError(res, e.errors);
			});
	})

	/**
	 * DELETE /rules/:id is invoked to delete one rule, identified by its unique id.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.delete(function(req, res, next) {
		return req.rule
			.destroy()
			.then(function() { return ruleEngineService.populate(); })
			.then(function() {
				return resourceService.deleted(res).end();
			})
			.error(function(err) {
				if (err.stack) {
					npmlog.info(err);
				}

				return resourceService.serverError(res, { message: err.message }).end();
			});
	});

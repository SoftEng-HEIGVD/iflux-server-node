var
	_ = require('underscore'),
	Promise = require('bluebird'),
	actionTargetDao = require('../persistence/actionTargetDao'),
	actionTypeDao = require('../persistence/actionTypeDao'),
	eventTypeDao = require('../persistence/eventTypeDao'),
	eventSourceDao = require('../persistence/eventSourceDao'),
	eventSourceTemplateDao = require('../persistence/eventSourceTemplateDao'),
	ruleService = require('../services/ruleService');

module.exports = {
	convert: function(ruleModel) {
		var rule = {
			id: ruleModel.get('id'),
			organizationId: ruleModel.get('organization_id'),
			name: ruleModel.get('name'),
			description: ruleModel.get('description'),
			active: ruleModel.get('active'),
			conditions: [],
			transformations: []
		};

		_.each(ruleModel.get('conditions'), function(condition) {
			var convertedCondition = {};

			if (condition.eventSource) {
				convertedCondition = _.extend(convertedCondition, {
					eventSource: {
						id: condition.eventSource.id,
						generatedIdentifier: condition.eventSource.generatedIdentifier
					}
				});
			}

			if (condition.eventType) {
				convertedCondition = _.extend(convertedCondition, {
					eventType: {
						id: condition.eventType.id,
						type: condition.eventType.type
					}
				});
			}

			if (condition.fn) {
				convertedCondition = _.extend(convertedCondition, {
					fn: {
						expression: condition.fn,
						sampleEvent: condition.sampleEvent
					}
				});
			}

			rule.conditions.push(convertedCondition);
		});

		_.each(ruleModel.get('transformations'), function(transformation) {
			var convertedTransformations = {};

			if (transformation.actionTarget) {
				convertedTransformations = _.extend(convertedTransformations, {
					actionTarget: {
						id: transformation.actionTarget.id,
						generatedIdentifier: transformation.actionTarget.generatedIdentifier
					}
				});
			}

			if (transformation.actionType) {
				convertedTransformations = _.extend(convertedTransformations, {
					actionType: {
						id: transformation.actionType.id,
						type: transformation.actionType.type
					}
				});
			}

			if (transformation.eventType) {
				convertedTransformations = _.extend(convertedTransformations, {
					eventType: {
						id: transformation.eventType.id,
						type: transformation.eventType.type
					}
				});
			}

			if (transformation.fn) {
				convertedTransformations = _.extend(convertedTransformations, {
					fn: {
						expression: transformation.fn,
						sample: {
							event: transformation.sampleEvent
						}
					}
				});

				if (transformation.sampleEventSourceId) {
					convertedTransformations.fn.sample.sampleEventSourceId = transformation.sampleEventSourceId;
				}

				if (transformation.sampleEventTypeId) {
					convertedTransformations.fn.sample.sampleEventTypeId = transformation.sampleEventTypeId;
				}
			}

			rule.transformations.push(convertedTransformations);
		});

		return rule;
	},

	/**
	 * Convert a ruleModel to a rule JSON object with relevant data for rules evaluation process.
	 * @param ruleModel The rule to convert
	 * @param cache Cache object to store retrieved entities
 	 * @returns {Promise} The promise to get a rule fulfilled.
	 */
	convertForEvaluation: function(ruleModel, cache) {
		var rule = {
			id: ruleModel.get('id'),
			organizationId: ruleModel.get('organization_id'),
			name: ruleModel.get('name'),
			description: ruleModel.get('description'),
			active: ruleModel.get('active'),
			conditions: [],
			transformations: []
		};

		var eventSourceIds = [];
		var eventTypeIds = [];
		var actionTargetIds = [];
		var actionTypeIds = [];

		_.each(ruleModel.get('conditions'), function(condition) {
			var convertedCondition = {};

			if (condition.eventSource && condition.eventSource.id) {
				if (!cache.eventSources[condition.eventSource.generatedIdentifier] && !_.contains(eventSourceIds, condition.eventSource.id)) {
					eventSourceIds.push(condition.eventSource.id);
				}

				convertedCondition = _.extend(convertedCondition, {
					eventSource: {
						id: condition.eventSource.id,
						generatedIdentifier: condition.eventSource.generatedIdentifier
					}
				});
			}

			if (condition.eventType && condition.eventType.id) {
				if (!cache.eventTypes[condition.eventType.type] && !_.contains(eventTypeIds, condition.eventType.id)) {
					eventTypeIds.push(condition.eventType.id);
				}

				convertedCondition = _.extend(convertedCondition, {
					eventType: {
						id: condition.eventType.id,
						type: condition.eventType.type
					}
				});
			}

			if (condition.fn) {
				convertedCondition = _.extend(convertedCondition, {
					fn: {
						compiled: ruleService.createConditionFn(condition.fn),
						expression: condition.fn,
						sampleEvent: condition.sampleEvent
					}
				});
			}

			rule.conditions.push(convertedCondition);
		});

		_.each(ruleModel.get('transformations'), function(transformation) {
			var convertedTransformations = {};

			if (!cache.actionTargets[transformation.actionTarget.generatedIdentifier] && !_.contains(actionTargetIds, transformation.actionTarget.id)) {
				actionTargetIds.push(transformation.actionTarget.id);
			}

			if (!cache.actionTypes[transformation.actionType.type] && !_.contains(actionTypeIds, transformation.actionType.id)) {
				actionTypeIds.push(transformation.actionType.id);
			}

			convertedTransformations = _.extend(convertedTransformations, {
				actionTarget: {
					id: transformation.actionTarget.id,
					generatedIdentifier: transformation.actionTarget.generatedIdentifier
				},
				actionType: {
					id: transformation.actionType.id,
					type: transformation.actionType.type
				}
			});

			if (transformation.eventType && transformation.eventType.id) {
				if (!cache.eventTypes[transformation.eventType.type] && !_.contains(eventTypeIds, transformation.eventType.id)) {
					eventTypeIds.push(transformation.eventType.id);
				}

				convertedTransformations = _.extend(convertedTransformations, {
					eventType: {
						id: transformation.eventType.id,
						type: transformation.eventType.type
					}
				});
			}

			if (transformation.fn) {
				convertedTransformations = _.extend(convertedTransformations, {
					fn: {
						compiled: ruleService.createTransformationFn(transformation.fn),
						expression: transformation.fn,
						sample: {
							event: transformation.sampleEvent
						}
					}
				});

				if (transformation.sampleEventSourceId) {
					convertedTransformations.fn.sample.sampleEventSourceId = transformation.sampleEventSourceId;
				}

				if (transformation.sampleEventTypeId) {
					convertedTransformations.fn.sample.sampleEventTypeId = transformation.sampleEventTypeId;
				}
			}

			rule.transformations.push(convertedTransformations);
		});

		return Promise
			.resolve()
			.then(function() {
				return actionTargetDao
					.findByIds(actionTargetIds)
					.then(function(actionTargetsRetrieved) {
						cache.actionTargets = _.extend(
							cache.actionTargets,
							_.reduce(
								actionTargetsRetrieved,
								function(memo, actionTarget) {
									memo[actionTarget.get('actionTargetId')] = actionTarget;
									return memo;
								},
								{}
							)
						);

						return actionTargetsRetrieved;
					}
				)
				.each(function(actionTarget) {
					return actionTarget.actionTargetTemplate().fetch().then(function(actionTargetTemplate) {
						cache.actionTargetTemplates[actionTargetTemplate.get('id')] = actionTargetTemplate;
					});
				});
			})
			.then(actionTypeDao.findByIds(actionTypeIds).then(function(actionTypesRetrieved) {
				cache.actionTypes = _.extend(cache.actionTypes, _.reduce(actionTypesRetrieved, function(memo, actionType) {
					memo[actionType.get('type')] = actionType;
					return memo;
				}, {}));
			}))
			.then(eventTypeDao.findByIds(eventTypeIds).then(function(eventTypesRetrieved) {
				cache.eventTypes = _.extend(cache.eventTypes, _.reduce(eventTypesRetrieved, function(memo, eventType) {
					memo[eventType.get('type')] = eventType;
					return memo;
				}, {}));
			}))
			.then(eventSourceDao.findByIds(eventSourceIds).then(function(eventSourcesRetrieved) {
					cache.eventSources = _.extend(cache.eventSources, _.reduce(eventSourcesRetrieved, function(memo, eventSource) {
						memo[eventSource.get('eventSourceId')] = eventSource;
						return memo;
					}, {}));
				})
			)
			.then(function() {
				cache.rules[ruleModel.get('id')] = ruleModel;
				return rule;
			});
	}
};
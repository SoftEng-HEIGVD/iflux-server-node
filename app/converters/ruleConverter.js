var
	_ = require('underscore'),
	Promise = require('bluebird'),
	actionTargetInstanceDao = require('../persistence/actionTargetInstanceDao'),
	actionTypeDao = require('../persistence/actionTypeDao'),
	eventTypeDao = require('../persistence/eventTypeDao'),
	eventSourceInstanceDao = require('../persistence/eventSourceInstanceDao'),
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

			if (condition.eventSourceInstanceId) {
				convertedCondition = _.extend(convertedCondition, {
					eventSourceInstanceId: condition.eventSourceInstanceId,
					eventSourceInstanceKey: condition.eventSourceInstanceKey
				});
			}

			if (condition.eventTypeId) {
				convertedCondition = _.extend(convertedCondition, {
					eventTypeId: condition.eventTypeId,
					eventType: condition.eventType
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

			convertedTransformations = _.extend(convertedTransformations, {
				actionTargetInstanceId: transformation.actionTargetInstanceId,
				actionTargetInstanceKey: transformation.actionTargetInstanceKey,
				actionTypeId: transformation.actionTypeId,
				actionType: transformation.actionType
			});

			if (transformation.eventTypeId) {
				convertedTransformations = _.extend(convertedTransformations, {
					eventTypeId: transformation.eventTypeId,
					eventType: transformation.eventType
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

				if (transformation.sampleEventSourceInstanceId) {
					convertedTransformations.fn.sample.sampleEventSourceInstanceId = transformation.sampleEventSourceInstanceId;
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

		var eventSourceInstanceIds = [];
		var eventTypeIds = [];
		var actionTargetInstanceIds = [];
		var actionTypeIds = [];

		_.each(ruleModel.get('conditions'), function(condition) {
			var convertedCondition = {};

			if (condition.eventSourceInstanceId) {
				if (!cache.eventSourceInstances[condition.eventSourceInstanceKey] && !_.contains(eventSourceInstanceIds, condition.eventSourceInstanceId)) {
					eventSourceInstanceIds.push(condition.eventSourceInstanceId);
				}

				convertedCondition = _.extend(convertedCondition, {
					eventSourceInstanceId: condition.eventSourceInstanceId,
					eventSourceInstanceKey: condition.eventSourceInstanceKey
				});
			}

			if (condition.eventTypeId) {
				if (!cache.eventTypes[condition.eventType] && !_.contains(eventTypeIds, condition.eventTypeId)) {
					eventTypeIds.push(condition.eventTypeId);
				}

				convertedCondition = _.extend(convertedCondition, {
					eventTypeId: condition.eventTypeId,
					eventType: condition.eventType
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

			if (!cache.actionTargetInstances[transformation.actionTargetInstanceKey] && !_.contains(actionTargetInstanceIds, transformation.actionTargetInstanceId)) {
				actionTargetInstanceIds.push(transformation.actionTargetInstanceId);
			}

			if (!cache.actionTypes[transformation.actionType] && !_.contains(actionTypeIds, transformation.actionTypeId)) {
				actionTypeIds.push(transformation.actionTypeId);
			}

			convertedTransformations = _.extend(convertedTransformations, {
				actionTargetInstanceId: transformation.actionTargetInstanceId,
				actionTargetInstanceKey: transformation.actionTargetInstanceKey,
				actionTypeId: transformation.actionTypeId,
				actionType: transformation.actionType
			});

			if (transformation.eventTypeId) {
				if (!cache.eventTypes[transformation.eventType] && !_.contains(eventTypeIds, transformation.eventTypeId)) {
					eventTypeIds.push(transformation.eventTypeId);
				}

				convertedTransformations = _.extend(convertedTransformations, {
					eventTypeId: transformation.eventTypeId,
					eventType: transformation.eventType
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

				if (transformation.sampleEventSourceInstanceId) {
					convertedTransformations.fn.sample.sampleEventSourceInstanceId = transformation.sampleEventSourceInstanceId;
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
				return actionTargetInstanceDao
					.findByIds(actionTargetInstanceIds)
					.then(function(actionTargetInstancesRetrieved) {
						cache.actionTargetInstances = _.extend(
							cache.actionTargetInstances,
							_.reduce(
								actionTargetInstancesRetrieved,
								function(memo, actionTargetInstance) {
									memo[actionTargetInstance.get('actionTargetInstanceId')] = actionTargetInstance;
									return memo;
								},
								{}
							)
						);

						return actionTargetInstancesRetrieved;
					}
				)
				.each(function(actionTargetInstance) {
					return actionTargetInstance.actionTargetTemplate().fetch().then(function(actionTargetTemplate) {
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
			.then(eventSourceInstanceDao.findByIds(eventSourceInstanceIds).then(function(eventSourceInstancesRetrieved) {
					cache.eventSourceInstances = _.extend(cache.eventSourceInstances, _.reduce(eventSourceInstancesRetrieved, function(memo, eventSourceInstance) {
						memo[eventSourceInstance.get('eventSourceInstanceId')] = eventSourceInstance;
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
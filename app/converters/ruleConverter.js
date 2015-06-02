var _ = require('underscore');

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
					eventTypeKey: condition.eventTypeKey
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
				actionTypeKey: transformation.actionTypeKey
			});

			if (transformation.eventTypeId) {
				convertedTransformations = _.extend(convertedTransformations, {
					eventTypeId: transformation.eventTypeId,
					eventTypeKey: transformation.eventTypeKey
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
	}
};
var _ = require('underscore');

module.exports = {
	convert: function(eventType) {
		return {
			id: eventType.get('id'),
			actionTypeId: eventType.get('actionTypeId'),
			name: eventType.get('name'),
			description: eventType.get('description'),
			actionTargetTemplateId: eventType.get('action_target_template_id'),
			schema: eventType.get('actionTypeSchema')
		};
	}
};
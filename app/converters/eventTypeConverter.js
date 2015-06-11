var _ = require('underscore');

module.exports = {
	convert: function(eventType) {
		return {
			id: eventType.get('id'),
			eventTypeId: eventType.get('eventTypeId'),
			name: eventType.get('name'),
			description: eventType.get('description'),
			eventSourceTemplateId: eventType.get('event_source_template_id'),
			schema: eventType.get('eventTypeSchema')
		};
	}
};
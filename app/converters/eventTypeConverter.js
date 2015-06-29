var _ = require('underscore');

module.exports = {
	convert: function(eventType) {
		return {
			id: eventType.get('id'),
			type: eventType.get('type'),
			public: eventType.get('public'),
			name: eventType.get('name'),
			description: eventType.get('description'),
			organizationId: eventType.get('organization_id'),
			schema: eventType.get('eventTypeSchema')
		};
	}
};
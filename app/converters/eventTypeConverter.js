var _ = require('underscore');

module.exports = {
	convert: function(eventType) {
		return {
			id: eventType.get('id'),
			name: eventType.get('name'),
			description: eventType.get('description'),
			schema: eventType.get('eventTypeSchema')
		};
	}
};
var
	_ = require('underscore'),
	EventType = require('../services/modelRegistry').eventType,
	dao = require('./dao');

module.exports = _.extend(new dao(EventType), {
	/**
	 * Create a new event type
	 *
	 * @param eventSourceTemplate The event source template to associate
	 * @param eventType The event type to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(eventSourceTemplate, eventType) {
		var data = {
			name: eventType.name,
			description: eventType.description,
			eventTypeSchema: eventType.schema,
			event_source_template_id: eventSourceTemplate.id
		};

		return this.model(data).save();
	}
});
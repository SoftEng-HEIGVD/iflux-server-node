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
	createAndSave: function(eventType, eventSourceTemplate) {
		var data = {
			name: eventType.name,
			description: eventType.description,
			type: eventType.type,
			eventTypeSchema: eventType.schema,
			event_source_template_id: eventSourceTemplate.id
		};

		return new this.model(data).save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('event_source_templates', 'event_types.event_source_template_id', 'event_source_templates.id')
					.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('event_types.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

	findByEventSourceTemplate: function(eventSourceTemplate, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('event_source_templates', 'event_types.event_source_template_id', 'event_source_templates.id')
				.where('event_types.event_source_template_id', eventSourceTemplate.get('id'));

			if (criteria.name) {
				qb = qb.where('event_types.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findByType: function(type) {
		return this.model.where({ type: type }).fetch();
	}
});
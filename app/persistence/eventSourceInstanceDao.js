var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	EventSourceInstance = require('../services/modelRegistry').eventSourceInstance,
	dao = require('./dao');

module.exports = _.extend(new dao(EventSourceInstance), {
	/**
	 * Create a new event source instance
	 *
	 * @param eventSourceInstance The event source instance to create and save
	 * @param organization The organization to link with the instance
	 * @param eventSourceTemplate The event source template to link with the instance
	 * @returns {Promise} A promise
	 */
	createAndSave: function(eventSourceInstance, organization, eventSourceTemplate) {
		var data = {
			name: eventSourceInstance.name,
			event_source_template_id: eventSourceTemplate.get('id'),
			organization_id: organization.get('id')
		};

		if (eventSourceTemplate.get('configurationSchema') && eventSourceInstance.configuration) {
			data.configuration = eventSourceInstance.configuration;
		}

		return new this.model(data).save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'event_source_instances.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('event_source_instances.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

	findByOrganizationId: function(organizationId) {
		return this.collection(
			this.model
			.where({ organization_id: organizationId })
		);
	},

	findByOrganization: function(organization) {
		return this.collectionFromRelation(organization.eventSourceInstances());
	},

	findByEventSourceTemplateAndUser: function(eventSourceTemplate, user) {
		return this.collection(function(qb) {
			return qb
				.leftJoin('organizations', 'event_source_instances.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'))
				.where('event_source_instances.event_source_template_id', eventSourceTemplate.get('id'));
		});
	},

	findAllByUser: function(user) {
		return this.collection(function(qb) {
			return qb
				.leftJoin('organizations', 'event_source_instances.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));
		});
	}
});
var
	_ = require('underscore'),
	Handlebars = require('handlebars'),
	bookshelf = require('../../config/bookshelf'),
	EventSourceTemplate = require('../services/modelRegistry').eventSourceTemplate,
	dao = require('./dao');

module.exports = _.extend(new dao(EventSourceTemplate), {
	/**
	 * Create a new event source template
	 *
	 * @param eventSourceTemplate The event source template to create and save
	 * @param organization The organization to link with the template
	 * @returns {Promise} A promise
	 */
	createAndSave: function(eventSourceTemplate, organization) {
		var data = {
			name: eventSourceTemplate.name,
			public: eventSourceTemplate.public,
			organization_id: organization.get('id')
		};

		if (eventSourceTemplate.configuration) {
			data = _.extend(data, {
				configurationSchema: eventSourceTemplate.configuration.schema,
				callbackUrl: eventSourceTemplate.configuration.callbackUrl,
				callbackToken: eventSourceTemplate.configuration.callbackToken
			});
		}

		var eventSourceTemplateModel = new this.model(data);

		return eventSourceTemplateModel.save();
	},

	findAllPublic: function() {
		return this.collectionFromModel({ public: true });
	},

	findByOrganizationId: function(organizationId) {
		return this.collection(
			this.model
			.where({ organization_id: organizationId })
		);
	},

	findByOrganization: function(organization) {
		return this.collectionFromRelation(organization.eventSourceTemplates());
	},

	findAllByUser: function(user) {
		return this.collection(function(qb) {
			return qb
				.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));
		});
	}
});
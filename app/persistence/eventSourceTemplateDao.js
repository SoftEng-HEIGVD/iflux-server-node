var
	_ = require('underscore'),
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
				configurationUrl: eventSourceTemplate.configuration.url,
				configurationToken: eventSourceTemplate.configuration.token
			});
		}

		if (eventSourceTemplate.configurationUi) {
			data = _.extend(data, { configurationUi: eventSourceTemplate.configurationUi });
		}

		var eventSourceTemplateModel = new this.model(data);

		return eventSourceTemplateModel.save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('event_source_templates.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
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
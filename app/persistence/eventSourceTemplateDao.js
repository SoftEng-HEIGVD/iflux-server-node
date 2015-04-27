var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	checkit = require('checkit'),
	EventSourceTemplate = require('../services/modelRegistry').eventSourceTemplate,
	dao = require('./dao'),
	organizationDao = require('./organizationDao');

module.exports = _.extend(new dao(EventSourceTemplate), {
	/**
	 * Create a new event source template
	 *
	 * @param eventSourceTemplate The event source template to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(eventSourceTemplate) {
		var self = this;

		return checkit({
			organizationId: [ {
				rule: 'existById',
				params: [ { dao: organizationDao, label: 'organization' } ]
			} ]
		})
		.run(eventSourceTemplate)
		.then(function() {
			var data = {
				name: eventSourceTemplate.name,
				public: eventSourceTemplate.public,
				organization_id: eventSourceTemplate.organizationId
			};

			if (eventSourceTemplate.configuration) {
				data = _.extend(data, {
					configurationSchema: eventSourceTemplate.configuration.schema,
					callbackUrl: eventSourceTemplate.configuration.callbackUrl,
					callbackToken: eventSourceTemplate.configuration.callbackToken
				});
			}

			var eventSourceTemplateModel = new self.model(data);

			return eventSourceTemplateModel.save();
		});
	},

	findAllPublic: function() {
		return this.collection(
			this.model
			.where({
				public: true
			})
		);
	},

	findByOrganizationId: function(organizationId) {
		return his.collection(
			this.model
			.where({ organization_id: organizationId })
		);
	},

	findAllForUser: function(user) {
		return this.collection(function(qb) {
			return qb
				.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));
		});
	}
});
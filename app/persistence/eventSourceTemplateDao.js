var
	_ = require('underscore'),
	Handlebars = require('handlebars'),
	bookshelf = require('../../config/bookshelf'),
	checkit = require('checkit'),
	ValidationError = require('checkit').ValidationError,
	EventSourceTemplate = require('../services/modelRegistry').eventSourceTemplate,
	dao = require('./dao'),
	organizationDao = require('./organizationDao');

var messageTemplate = Handlebars.compile('The organizationId {{id}} does not exist or the user is not from this organization.');

module.exports = _.extend(new dao(EventSourceTemplate), {
	/**
	 * Create a new event source template
	 *
	 * @param eventSourceTemplate The event source template to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(currentUser, eventSourceTemplate) {
		var self = this;

		return checkit({
			organizationId: [ {
				// Check that the user is part of the organization. Therefore, the check also do the job
				// to check if the organization id exists.
				rule: function(val) {
					return organizationDao
						.findByIdAndUser(eventSourceTemplate.organizationId, currentUser)
						.catch(organizationDao.model.NotFoundError, function(err) {
							throw new ValidationError(messageTemplate({ id: eventSourceTemplate.organizationId }));
						});
				}
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
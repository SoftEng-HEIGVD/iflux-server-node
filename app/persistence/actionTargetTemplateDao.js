var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	ActionTargetTemplate = require('../services/modelRegistry').actionTargetTemplate,
	dao = require('./dao');

module.exports = _.extend(new dao(ActionTargetTemplate), {
	/**
	 * Create a new action target template
	 *
	 * @param actionTargetTemplate The action target template to create and save
	 * @param organization The organization to link with the template
	 * @returns {Promise} A promise
	 */
	createAndSave: function(actionTargetTemplate, organization) {
		var data = {
			name: actionTargetTemplate.name,
			public: actionTargetTemplate.public,
			organization_id: organization.get('id'),
			targetUrl: actionTargetTemplate.target.url,
			targetToken: actionTargetTemplate.target.token
		};

		if (actionTargetTemplate.configuration) {
			data = _.extend(data, {
				configurationSchema: actionTargetTemplate.configuration.schema,
				configurationUrl: actionTargetTemplate.configuration.url,
				configurationToken: actionTargetTemplate.configuration.token
			});
		}

		if (actionTargetTemplate.configurationUi) {
			data = _.extend(data, { configurationUi: actionTargetTemplate.configurationUi });
		}

		var actionTargetTemplateModel = new this.model(data);

		return actionTargetTemplateModel.save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'action_target_templates.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('action_target_templates.id', id)
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
		return this.collectionFromRelation(organization.actionTargetTemplates());
	},

	findAllByUser: function(user) {
		return this.collection(function(qb) {
			return qb
				.leftJoin('organizations', 'action_target_templates.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));
		});
	}
});
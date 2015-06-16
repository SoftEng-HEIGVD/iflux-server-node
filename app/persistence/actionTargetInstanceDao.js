var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	ActionTargetInstance = require('../services/modelRegistry').actionTargetInstance,
	dao = require('./dao');

module.exports = _.extend(new dao(ActionTargetInstance), {
	/**
	 * Create a new action target instance
	 *
	 * @param actionTargetInstance The action target instance to create and save
	 * @param organization The organization to link with the instance
	 * @param actionTargetTemplate The action target template to link with the instance
	 * @returns {Promise} A promise
	 */
	createAndSave: function(actionTargetInstance, organization, actionTargetTemplate) {
		var data = {
			name: actionTargetInstance.name,
			action_target_template_id: actionTargetTemplate.get('id'),
			organization_id: organization.get('id')
		};

		if (actionTargetTemplate.get('configurationSchema') && actionTargetInstance.configuration) {
			data.configuration = actionTargetInstance.configuration;
		}

		return new this.model(data).save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'action_target_instances.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('action_target_instances.id', id)
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

	findByOrganization: function(organization, criteria) {
		return this.collection(function(qb) {
			var qb = qb
				.leftJoin('organizations', 'action_target_instances.organization_id', 'organizations.id')
				.where('organizations.id', organization.get('id'));

			if (criteria.name) {
				qb = qb.where('action_target_instances.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findByActionTargetTemplateAndUser: function(actionTargetTemplate, user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_target_instances.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'))
				.where('action_target_instances.action_target_template_id', actionTargetTemplate.get('id'));

			if (criteria.name) {
				qb = qb.where('action_target_instances.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findAllByUser: function(user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_target_instances.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('action_target_instances.name', 'like', criteria.name);
			}

			return qb;
		});
	}
});
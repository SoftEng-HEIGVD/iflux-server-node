var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	ActionTarget = require('../services/modelRegistry').actionTarget,
	dao = require('./dao');

module.exports = _.extend(new dao(ActionTarget), {
	/**
	 * Create a new action target
	 *
	 * @param actionTarget The action target to create and save
	 * @param organization The organization to link
	 * @param actionTargetTemplate The action target template to link
	 * @returns {Promise} A promise
	 */
	createAndSave: function(actionTarget, organization, actionTargetTemplate) {
		var data = {
			name: actionTarget.name,
			action_target_template_id: actionTargetTemplate.get('id'),
			organization_id: organization.get('id')
		};

		if (actionTargetTemplate.get('configurationSchema') && actionTarget.configuration) {
			data.configuration = actionTarget.configuration;
		}

		return new this.model(data).save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'action_targets.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('action_targets.id', id)
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
				.leftJoin('organizations', 'action_targets.organization_id', 'organizations.id')
				.where('organizations.id', organization.get('id'));

			if (criteria.name) {
				qb = qb.where('action_targets.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findByActionTargetTemplateAndUser: function(actionTargetTemplate, user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_targets.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'))
				.where('action_targets.action_target_template_id', actionTargetTemplate.get('id'));

			if (criteria.name) {
				qb = qb.where('action_targets.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findAllByUser: function(user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_targets.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('action_targets.name', 'like', criteria.name);
			}

			return qb;
		});
	}
});
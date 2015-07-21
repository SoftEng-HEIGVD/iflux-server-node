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

	findByIdAndUserOrPublic: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'action_target_templates.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('action_target_templates.id', id)
					.where(function() {
						return this
							.where('organizations_users.user_id', user.get('id'))
							.orWhere('action_target_templates.public', true);
					})
			})
			.fetch({require: true});
	},

	findAllPublic: function(criteria) {
		var whereClause = [{ public: true }];

		if (criteria.name) {
			whereClause.push(['name', 'like', criteria.name]);
		}

		return this.collectionFromModel(whereClause);
	},

	findAllAccessible: function(user, criteria) {
		var t = this;
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_target_templates.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where(function() {
					return this
						.where('organizations_users.user_id', user.get('id'))
						.orWhere('public', true);
				});

			if (criteria.name) {
				qb = qb.where('action_target_templates.name', 'like', criteria.name);
			}

			// TODO: Dirty hack to avoid duplicated data in the result set, try to find a way to do that properly
			return qb.select(t.knex.raw('DISTINCT ON (action_target_templates.id) *'));
		});
	},

	findByOrganizationId: function(organizationId) {
		return this.collection(
			this.model
			.where({ organization_id: organizationId })
		);
	},

	findByOrganization: function(organization, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_target_templates.organization_id', 'organizations.id')
				.where('organizations.id', organization.get('id'));

			if (criteria.name) {
				qb = qb.where('action_target_templates.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findAllByUser: function(user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_target_templates.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('action_target_templates.name', 'like', criteria.name);
			}

			return qb;
		});
	},

  /**
 	 * Count the references of an action target templates
 	 *
 	 * @param actionTargetTemplate The action target template
 	 */
 	countReferences: function(actionTargetTemplate) {
 		return this.knex.raw(
 			'select count(action_target_template_id) from action_targets where action_target_template_id = $1',
 			[ actionTargetTemplate.get('id') ]
 		);
 	}
});
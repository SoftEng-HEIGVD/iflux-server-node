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
			organization_id: organization.get('id'),
      public: _.isUndefined(actionTarget.public) ? false : actionTarget.public
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
					.leftJoin('organizations_users', 'action_targets.organization_id', 'organizations_users.organization_id')
					.where('action_targets.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

  findByIdAndUserOrPublic: function(id, user) {
 		return this.model
 			.query(function(qb) {
 				return qb
 					.leftJoin('organizations_users', 'action_targets.organization_id', 'organizations_users.organization_id')
 					.where('action_targets.id', id)
 					.where(function() {
 						return this
 							.where('organizations_users.user_id', user.get('id'))
 							.orWhere('action_targets.public', true);
 					})
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
				.leftJoin('organizations_users', 'action_targets.organization_id', 'organizations_users.organization_id')
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
				.leftJoin('organizations_users', 'action_targets.organization_id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('action_targets.name', 'like', criteria.name);
			}

			return qb;
		});
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
 				.leftJoin('organizations_users', function() {
          return this
            .on('action_targets.organization_id', 'organizations_users.organization_id')
            .andOn('organizations_users.user_id', '=', user.get('id'));
        })
        .where(function() {
 					return this
            .where('organizations_users.user_id', user.get('id'))
 						.orWhere('public', true);
 				});

 			if (criteria.name) {
 				qb = qb.where('action_targets.name', 'like', criteria.name);
 			}

 			return qb;
 		});
 	},
});
var
	_ = require('underscore'),
	ActionType = require('../services/modelRegistry').actionType,
	dao = require('./dao');

module.exports = _.extend(new dao(ActionType), {
	/**
	 * Create a new action type
	 *
	 * @param organization The organization to link
	 * @param actionType The action type to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(actionType, organization) {
		var data = {
			name: actionType.name,
			type: actionType.type,
			description: actionType.description,
			public: actionType.public,
			actionTypeSchema: actionType.schema,
			organization_id: organization.id
		};

		return new this.model(data).save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'action_types.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('action_types.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

	findByIdAndUserOrPublic: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'action_types.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('action_types.id', id)
					.where(function() {
						return this
							.where('organizations_users.user_id', user.get('id'))
							.orWhere('action_types.public', true);
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

	findByOrganizationId: function(organizationId) {
		return this.collection(
			this.model
			.where({ organization_id: organizationId })
		);
	},

	findByOrganization: function(organization, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_types.organization_id', 'organizations.id')
				.where('organizations.id', organization.get('id'));

			if (criteria.name) {
				qb = qb.where('action_types.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findAllByUser: function(user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'action_types.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('action_types.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findByType: function(type) {
		return this.model.where({ type: type }).fetch();
	}
});
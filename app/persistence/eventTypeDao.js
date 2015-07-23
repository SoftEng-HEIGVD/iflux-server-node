var
	_ = require('underscore'),
	EventType = require('../services/modelRegistry').eventType,
	dao = require('./dao');

module.exports = _.extend(new dao(EventType), {
	/**
	 * Create a new event type
	 *
	 * @param organization The organization
	 * @param eventType The event type to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(eventType, organization) {
		var data = {
			name: eventType.name,
			description: eventType.description,
			type: eventType.type,
      public: _.isUndefined(eventType.public) ? false : eventType.public,
			eventTypeSchema: eventType.schema,
			organization_id: organization.id
		};

		return new this.model(data).save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'event_types.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('event_types.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

	findByIdAndUserOrPublic: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'event_types.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('event_types.id', id)
					.where(function() {
						return this
							.where('organizations_users.user_id', user.get('id'))
							.orWhere('event_types.public', true);
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
				.leftJoin('organizations_users', 'event_types.organization_id', 'organizations_users.organization_id')
				.where(function() {
					return this
						.where('organizations_users.user_id', user.get('id'))
						.orWhere('public', true);
				});

			if (criteria.name) {
				qb = qb.where('event_types.name', 'like', criteria.name);
			}

			// TODO: Dirty hack to avoid duplicated data in the result set, try to find a way to do that properly
			return qb.select(t.knex.raw('DISTINCT ON (event_types.id) *'));
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
				.leftJoin('organizations', 'event_types.organization_id', 'organizations.id')
				.where('organizations.id', organization.get('id'));

			if (criteria.name) {
				qb = qb.where('event_types.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findAllByUser: function(user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'event_types.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('event_types.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findByType: function(type) {
		return this.model.where({ type: type }).fetch();
	}
});
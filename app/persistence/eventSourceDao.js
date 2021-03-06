var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	EventSource = require('../services/modelRegistry').eventSource,
	dao = require('./dao');

module.exports = _.extend(new dao(EventSource), {
	/**
	 * Create a new event source
	 *
	 * @param eventSource The event source to create and save
	 * @param organization The organization to link
	 * @param eventSourceTemplate The event source template to link
	 * @returns {Promise} A promise
	 */
	createAndSave: function(eventSource, organization, eventSourceTemplate) {
		var data = {
			name: eventSource.name,
			event_source_template_id: eventSourceTemplate.get('id'),
			organization_id: organization.get('id'),
      public: _.isUndefined(eventSource.public) ? false : eventSource.public
		};

		if (eventSourceTemplate.get('configurationSchema') && eventSource.configuration) {
			data.configuration = eventSource.configuration;
		}

		return new this.model(data).save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations_users', 'event_sources.organization_id', 'organizations_users.organization_id')
					.where('event_sources.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

  findByIdAndUserOrPublic: function(id, user) {
 		return this.model
 			.query(function(qb) {
 				return qb
 					.leftJoin('organizations_users', 'event_sources.organization_id', 'organizations_users.organization_id')
 					.where('event_sources.id', id)
 					.where(function() {
 						return this
 							.where('organizations_users.user_id', user.get('id'))
 							.orWhere('event_sources.public', true);
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
				.leftJoin('organizations', 'event_sources.organization_id', 'organizations.id')
				.where('organizations.id', organization.get('id'));

			if (criteria.name) {
				qb = qb.where('event_sources.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findByEventSourceTemplateAndUser: function(eventSourceTemplate, user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations_users', 'event_sources.organization_id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'))
				.where('event_sources.event_source_template_id', eventSourceTemplate.get('id'));

			if (criteria.name) {
				qb = qb.where('event_sources.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findAllByUser: function(user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations_users', 'event_sources.organization_id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('event_sources.name', 'like', criteria.name);
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
            .on('event_sources.organization_id', 'organizations_users.organization_id')
            .andOn('organizations_users.user_id', '=', user.get('id'));
        })
 				.where(function() {
 					return this
 						.where('organizations_users.user_id', user.get('id'))
 						.orWhere('public', true);
 				});

 			if (criteria.name) {
 				qb = qb.where('event_sources.name', 'like', criteria.name);
 			}

 			return qb;
 		});
 	},
});
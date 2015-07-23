var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	EventSourceTemplate = require('../services/modelRegistry').eventSourceTemplate,
	dao = require('./dao');

module.exports = _.extend(new dao(EventSourceTemplate), {
	/**
	 * Create a new event source template
	 *
	 * @param eventSourceTemplate The event source template to create and save
	 * @param organization The organization to link with the template
	 * @returns {Promise} A promise
	 */
	createAndSave: function(eventSourceTemplate, organization) {
		var data = {
			name: eventSourceTemplate.name,
      public: _.isUndefined(eventSourceTemplate.public) ? false : eventSourceTemplate.public,
			organization_id: organization.get('id')
		};

		if (eventSourceTemplate.configuration) {
			data = _.extend(data, {
				configurationSchema: eventSourceTemplate.configuration.schema,
				configurationUrl: eventSourceTemplate.configuration.url,
				configurationToken: eventSourceTemplate.configuration.token
			});
		}

		if (eventSourceTemplate.configurationUi) {
			data = _.extend(data, { configurationUi: eventSourceTemplate.configurationUi });
		}

		var eventSourceTemplateModel = new this.model(data);

		return eventSourceTemplateModel.save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('event_source_templates.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

	findByIdAndUserOrPublic: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('event_source_templates.id', id)
					.where(function() {
						return this
							.where('organizations_users.user_id', user.get('id'))
							.orWhere('event_source_templates.public', true);
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
				.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where(function() {
					return this
						.where('organizations_users.user_id', user.get('id'))
						.orWhere('public', true);
				});

			if (criteria.name) {
				qb = qb.where('event_source_templates.name', 'like', criteria.name);
			}

			// TODO: Dirty hack to avoid duplicated data in the result set, try to find a way to do that properly
			return qb.select(t.knex.raw('DISTINCT ON (event_source_templates.id) *'));
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
				.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
				.where('organizations.id', organization.get('id'));

			if (criteria.name) {
				qb = qb.where('event_source_templates.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findAllByUser: function(user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'event_source_templates.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('event_source_templates.name', 'like', criteria.name);
			}

			return qb;
		});
	},

  /**
 	 * Count the references of an event source templates
 	 *
 	 * @param eventSourceTemplate The event source template
 	 */
 	countReferences: function(eventSourceTemplate) {
 		return this.knex.raw(
 			'select count(event_source_template_id) from event_sources where event_source_template_id = $1',
 			[ eventSourceTemplate.get('id') ]
 		);
 	}
});
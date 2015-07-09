var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	Organization = require('../services/modelRegistry').organization,
	dao = require('./dao');

module.exports = _.extend(new dao(Organization), {
	/**
	 * Create a new organization and save it to the database
	 *
	 * @param organization The organization to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(organization, user) {
		var self = this;

		return bookshelf.transaction(function(t) {
			var orgaModel = new self.model({
				name: organization.name
			});

			return orgaModel
				.save(null, { transacting: t })
				.then(function(orgaSaved) {
					return orgaSaved
						.addUser(user, { transacting: t })
						.then(function() {
							return orgaSaved;
						});
				});
		});
	},

	/**
	 * Find by organization and user. Allow detecting if a user is a member
	 * of an organization or not.
	 *
	 * @param organizationId The organization to find
	 * @param user The user
	 * @returns {Promise} A promise
	 */
	findByIdAndUser: function(organizationId, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('organizations.id', organizationId)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

	/**
	 * Find an organization by its name. An equality matching is done.
	 *
	 * @param name The name of the organization to retrieve
	 * @returns {Promise} A promise
	 */
	findByName: function(name) {
		return this.model
			.query('where', 'name', 'like', name)
			.fetchAll()
			.then(function (result) {
				return result.models;
			});
	},

	/**
	 * Count the references of an organization in the different models
	 *
	 * @param organization The organization
	 */
	countReferences: function(organization) {
		var id = organization.get('id');

		return this.knex.raw(
			'select t1.c + t2.c + t3.c + t4.c + t5.c + t6.c + t7.c + t8.c from ' +
		    '(select count(organization_id) as c from organizations_users where organization_id = $1) as t1, ' +
		    '(select count(id) as c from rules where organization_id = $1) as t2, ' +
			  '(select count(id) as c from event_types where organization_id = $1) as t3, ' +
			  '(select count(id) as c from event_sources where organization_id = $1) as t4, ' +
			  '(select count(id) as c from event_source_templates where organization_id = $1) as t5, ' +
			  '(select count(id) as c from action_types where organization_id = $1) as t6, ' +
			  '(select count(id) as c from action_targets where organization_id = $1) as t7, ' +
			  '(select count(id) as c from action_target_templates where organization_id = $1) as t8',
			[ id ]
		);
	}
});
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
						.users()
						.attach(user.get('id'), { transacting: t })
						.then(function() {
							return orgaSaved;
						});
				});
		});
	},

	findByIdAndUser: function(organizationId, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('organizations.id', organizationId)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	}
});
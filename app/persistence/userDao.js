var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	checkit = require('checkit'),
	User = require('../services/modelRegistry').user,
	dao = require('./dao'),
	organizationDao = require('./organizationDao');

module.exports = _.extend(new dao(User), {
	/**
	 * Create a new user and save it to the database
	 *
	 * @param user The user to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(user) {
		var self = this;

		return bookshelf.transaction(function(t) {
			return checkit({
				organizationId: [ {
					rule: 'existById',
					params: [ { dao: organizationDao, label: 'organization' } ]
				} ]
			})
			.run(user)
			.then(function() {
				var userModel = new self.model({
					email: user.email,
					password: '',
					firstName: user.firstName,
					lastName: user.lastName
				});

				return userModel
					.save(null, { transacting: t })
					.then(function(userSaved) {
						return userSaved
							.organizations()
							.attach(user.organizationId, { transacting: t })
							.then(function() {
								return userSaved;
							});
					});
			});
		});
	}
});
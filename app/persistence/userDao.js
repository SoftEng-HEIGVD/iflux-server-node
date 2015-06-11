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
	createAndSave: function(user, organizationId) {
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
					password: user.password,
					passwordConfirmation: user.passwordConfirmation,
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
	},

	/**
	 * Create a new user and save it to the database
	 *
	 * @param user The user to create and save
	 * @returns {Promise} A promise
	 */
	createNotLinkedAndSave: function(user) {
		var userModel = new this.model({
			email: user.email,
			password: user.password,
			passwordConfirmation: user.passwordConfirmation,
			firstName: user.firstName,
			lastName: user.lastName
		});

		return userModel.save();
	},

	/**
	 * Find a user by his email address
	 *
	 * @param email The email address to lookup
	 * @returns {Promise} A promise
	 */
	findByEmail: function(email) {
		return this.model.where({ email: email }).fetch({ require: true });
	}
});
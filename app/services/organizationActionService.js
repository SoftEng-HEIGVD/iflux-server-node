var
	userDao = require('../persistence/userDao');

module.exports = {
	addUser: function(params, organization, user) {
		var promise;

		if (params.userId) {
			promise = userDao.findById(params.userId);
		}
		else {
			promise = userDao.findByEmail(params.email);
		}

		return promise
			.then(function(userToAdd) {
				return organization.addUser(userToAdd);
			})
			.catch(userDao.model.NotFoundError, function(err) {
				throw new ValidationError()
			});
	},

	removeUser: function(params, organization, user) {
		var promise;

		if (params.userId) {
			promise = userDao.findById(params.userId);
		}
		else {
			promise = userDao.findByEmail(params.email);
		}

		return promise
			.then(function(userToRemove) {
				return organization.removeUser(userToRemove);
			});
	}
};
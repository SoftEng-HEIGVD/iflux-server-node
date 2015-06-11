var
	userDao = require('../persistence/userDao');

module.exports = {
	addUser: function(params, organization, user) {
		return userDao
			.findByEmail(params.email)
			.then(function(userToAdd) {
				return organization.users().attach(userToAdd);
			})
			.catch(userDao.model.NotFoundError, function(err) {
				throw new ValidationError()
			});
	},

	removeUser: function(params, organization, user) {
		return userDao
			.findByEmail(params.email)
			.then(function(userToRemove) {
				return organization.users().detach(userToRemove);
			});
	}
};
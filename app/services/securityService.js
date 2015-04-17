var
	_ = require('underscore'),
	passwordHash = require('password-hash');

module.exports = {
	hashPassword: function(password) {
		return passwordHash.generate(password, { algorithm: 'sha512', saltLength: 32, iterations: 10 });
	},

	verify: function(password, storedHash) {
		return passwordHash.verify(password, storedHash);
	}
};

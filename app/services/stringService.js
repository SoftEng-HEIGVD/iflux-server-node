var
	crypto = require('crypto'),
	randomString = require('random-string');

module.exports = {
	generateId: function() {
		return randomString({length: 12});
	},

	generateEventId: function() {
		return randomString({length: 25});
	},

	hash: function(str) {
		return crypto.createHash('sha').update(str).digest('hex');
	}
};
var
	randomString = require('random-string');

module.exports = {
	generateId: function() {
		return randomString({length: 12});
	}
};
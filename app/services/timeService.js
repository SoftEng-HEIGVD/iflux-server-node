var
	moment = require('moment');

module.exports = {
	timestamp: function() {
		// ISO 8601 timestamp
		return moment.utc().format();
	}
};
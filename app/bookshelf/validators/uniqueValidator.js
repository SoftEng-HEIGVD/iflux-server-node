var ValidationError = require('checkit').ValidationError;

module.exports = function(options) {
	return function(value, tableName, columnName, message) {
		var where = {};

		where[columnName] = value;

		return options.bookshelf
			.knex(tableName)
			.where(where)
			.count('* AS count')
			.then(function (results) {
				if (results[0].count > 0) {
					if (message) {
						throw new ValidationError(message);
					}
					else {
						throw new ValidationError(value + ' for ' + tableName + '.' + columnName + ' is not unique.');
					}
				}
			});
	}
};
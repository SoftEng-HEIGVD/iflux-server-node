var ValidationError = require('checkit').ValidationError;

module.exports = function(options) {
	return function(value, tableName, columnName, message) {
		var whereClause = {};

		whereClause[columnName] = value;

		var qb = options.bookshelf.knex(tableName);

		if (this._target.get('id')) {
			qb = qb.where('id', '!=', this._target.get('id'));
		}

		return qb.where(whereClause)
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
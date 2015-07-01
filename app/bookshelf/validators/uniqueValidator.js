var
	_ = require('underscore'),
	s = require('underscore.string'),
	ValidationError = require('checkit').ValidationError;

module.exports = function(options) {
	return function(value, tableName, constraintDefinition, message, scopedBy) {
		var whereClause = {};

		if (s.startsWith(constraintDefinition, "[")) {
			var constraints = constraintDefinition.substr(1, constraintDefinition.length - 2).split(',');

			whereClause[s.trim(constraints[0])] = value;

			_.each(_.rest(constraints), function(constraint) {
				whereClause[s.trim(constraint)] = this._target.get(s.trim(constraint));
			}, this);
		}
		else {
			whereClause[constraintDefinition] = value;
		}

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
						throw new ValidationError(value + ' for ' + tableName + '.' + constraintDefinition + ' is not unique.');
					}
				}
			});
	}
};
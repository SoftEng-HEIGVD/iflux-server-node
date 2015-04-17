var
	_ = require('underscore'),
	Handlebars = require('handlebars'),
	ValidationError = require('checkit').ValidationError;

var messageTemplate = Handlebars.compile('{{ label }} does not exist for id: {{ id }}.');

module.exports = function() {
	return function(value, options) {
		return options.dao
			.findById(value)
			.catch(options.dao.model.NotFoundError, function(e) {
				throw new ValidationError(messageTemplate(_.extend(options, { id: value })));
			});
	}
};
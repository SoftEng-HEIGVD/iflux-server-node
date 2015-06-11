var
	_ = require('underscore'),
	s = require('underscore.string'),
	config = require('./config'),
	knex = require('knex')(config.knex),
	bookshelf = require('bookshelf')(knex),
	checkit = require('checkit'),
	validationPlugin = require('../app/bookshelf/bookshelfiFluxPlugin');

bookshelf.plugin('virtuals');
bookshelf.plugin(validationPlugin);

var
	validatorFunctions = require('require-directory')(module, '../app/bookshelf/validators'),
	validators = {};

for(var validatorName in validatorFunctions) {
	validators[s.replaceAll(validatorName, 'Validator', '')] = validatorFunctions[validatorName]({ bookshelf: bookshelf });
}

_.extend(checkit.Validator.prototype, validators);

module.exports = bookshelf;

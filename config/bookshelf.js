var
	_ = require('underscore'),
	s = require('underscore.string'),
	config = require('./config'),
	knex = require('knex')(config.knex),
	bookshelf = require('bookshelf')(knex),
	checkit = require('checkit'),
	validationPlugin = require('../app/validations/bookshelfValidationPlugin');

bookshelf.plugin(validationPlugin);

var
	validatorFunctions = require('require-directory')(module, '../app/validations/validators'),
	validators = {};

for(var validatorName in validatorFunctions) {
	validators[s.replaceAll(validatorName, 'Validator', '')] = validatorFunctions[validatorName]({ bookshelf: bookshelf });
}

_.extend(checkit.Validator.prototype, validators);

module.exports = bookshelf;

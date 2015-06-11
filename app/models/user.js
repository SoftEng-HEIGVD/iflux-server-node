var
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	securityService = require('../services/securityService'),
	Promise  = require('bluebird');

var User = module.exports = bookshelf.Model.extend({
	tableName: 'users',
	hasTimestamps: true,

	validations: {
		firstName: [ 'minLength:2' ],
		lastName: [ 'minLength:2' ],
		email: [ 'required', 'unique:users:email:Address email is already taken.' ],
		password: [ 'required' ],
		passwordConfirmation: [ 'required' ]
	},

	conditionalValidations: [
		{
			validations: {
				password: [ 'minLength:6', function(value, context, params) {
					if (value != context.passwordConfirmation) {
						throw new Error('Password does not match');
					}
				} ]
			},
			handler: function(input) {
				return input.password !== undefined && input.password.length > 0;
			}
		}
	],

	virtuals: {
		password: {
			get: function() {
				return this.virtualValues.password;
			},
			set: function(password) {
				this.virtualValues.password = password;
			}
		},
		passwordConfirmation: {
			get: function() {
				return this.virtualValues.passwordConfirmation;
			},
			set: function(passwordConfirmation) {
				this.virtualValues.passwordConfirmation = passwordConfirmation;
			}
		}
	},

	eventDefinitions: {
		saving: [
			function(model, attributes, options) {
				if (model.password !== undefined) {
					model.set('passwordHash', securityService.hashPassword(model.password));
				}
			}
		]
	},

	organizations: function() {
		return this.belongsToMany(modelRegistry.organization);
	}
});
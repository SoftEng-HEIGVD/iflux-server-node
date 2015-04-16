var
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	Promise  = require('bluebird');

var User = module.exports = bookshelf.Model.extend({
	tableName: 'users',
	hasTimestamps: true,

	validations: {
		firstName: [ 'minLength:2' ],
		lastName: [ 'minLength:2' ],
		email: [ 'required', 'email', 'unique:users:email:Address email is already taken.' ]
		//password: [
		//
		//],
	},

	organizations: function() {
		return this.belongsToMany(modelRegistry.organization);
	}
});
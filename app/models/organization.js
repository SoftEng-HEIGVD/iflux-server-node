var
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	Promise  = require('bluebird');

var Organization = module.exports = bookshelf.Model.extend({
	tableName: 'organizations',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:organizations:name:Name is already taken.' ]
	},

	users: function() {
		return this.belongsToMany(modelRegistry.user);
	},

	eventSourceTemplates: function() {
		return this.hasMany(modelRegistry.eventSourceTemplate);
	},

	actionTargetTemplates: function() {
		return this.hasMany(modelRegistry.actionTargetTemplate);
	}
});
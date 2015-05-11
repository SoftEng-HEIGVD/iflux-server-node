var
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	Promise  = require('bluebird');

var ActionTargetTemplate = module.exports = bookshelf.Model.extend({
	tableName: 'action_target_templates',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:action_target_templates:name:Name is already taken.' ]
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	actionTypes: function() {
		return this.hasMany(modelRegistry.actionType);
	},

	actionTargetInstances: function() {
		return this.hasMany(modelRegistry.actionTargetInstance)
	}
});
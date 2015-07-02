var
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	Promise  = require('bluebird');

var ActionTargetTemplate = module.exports = bookshelf.Model.extend({
	tableName: 'action_target_templates',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:action_target_templates:[name, organization_id]:Name is already taken in this organization.' ]
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	actionTypes: function() {
		return this.hasMany(modelRegistry.actionType);
	},

	actionTargets: function() {
		return this.hasMany(modelRegistry.actionTarget)
	}
});
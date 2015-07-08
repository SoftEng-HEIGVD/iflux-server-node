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

	increaseReferenceCount: function() {
		this.set('refCount', this.get('refCount') + 1);
		return this.save();
	},

	decreaseReferenceCount: function() {
		this.set('refCount', this.get('refCount') - 1);
		return this.save();
	},

	users: function() {
		return this.belongsToMany(modelRegistry.user);
	},

	eventSourceTemplates: function() {
		return this.hasMany(modelRegistry.eventSourceTemplate);
	},

	eventSources: function() {
		return this.hasMany(modelRegistry.eventSource);
	},

	actionTargetTemplates: function() {
		return this.hasMany(modelRegistry.actionTargetTemplate);
	},

	actionTargets: function() {
		return this.hasMany(modelRegistry.actionTarget);
	},

	rules: function() {
		return this.hasMany(modelRegistry.rule);
	}
});
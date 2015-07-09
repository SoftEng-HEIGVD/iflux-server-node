var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	Promise  = require('bluebird');

var Organization = module.exports = bookshelf.Model.extend({
	tableName: 'organizations',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:organizations:name:Name is already taken.' ]
	},

	increaseReferenceCount: function(options) {
		this.set('refCount', this.get('refCount') + 1);

		options = _.defaults(options || {}, { save: true });

		if (options.save && this.get('id')) {
			return this.save();
		}
	},

	decreaseReferenceCount: function(options) {
		this.set('refCount', this.get('refCount') - 1);

		options = _.defaults(options || {}, { save: true });

		if (options.save && this.get('id')) {
			return this.save();
		}
	},

	addUser: function(user, options) {
		var orga = this;

		return this
			.users()
			.attach(user.get('id'), options)
			.then(function() {
				return orga.increaseReferenceCount({ save: false });
			});
	},

	removeUser: function(user, options) {
		var orga = this;

		return this
			.users()
			.detach(user.get('id'), options)
			.then(function() {
				return orga.decreaseReferenceCount();
			});
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
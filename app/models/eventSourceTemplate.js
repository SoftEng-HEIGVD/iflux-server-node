var
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	Promise  = require('bluebird');

var EventSourceTemplate = module.exports = bookshelf.Model.extend({
	tableName: 'event_source_templates',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:event_source_templates:name:Name is already taken.' ]
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	eventTypes: function() {
		return this.hasMany(modelRegistry.eventType);
	},

	eventSources: function() {
		return this.hasMany(modelRegistry.eventSource)
	}
});
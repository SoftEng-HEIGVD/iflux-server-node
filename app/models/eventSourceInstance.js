var
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	Promise  = require('bluebird');

var EventSourceInstance = module.exports = bookshelf.Model.extend({
	tableName: 'event_source_instance',
	hasTimestamps: true,

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	eventSourceTemplate: function() {
		return this.belongsTo(modelRegistry.eventSourceTemplate);
	}
});
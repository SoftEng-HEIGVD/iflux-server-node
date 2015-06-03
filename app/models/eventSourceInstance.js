var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry');

var EventSourceInstance = module.exports = bookshelf.Model.extend({
	tableName: 'event_source_instances',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:event_source_instances:name:Name is already taken.' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('eventSourceInstanceId')) {
				model.set('eventSourceInstanceId', stringService.generateId());
			}
		});
	},

	generatedId: function() {
		return this.get('eventSourceInstanceId');
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	eventSourceTemplate: function() {
		return this.belongsTo(modelRegistry.eventSourceTemplate);
	}
});
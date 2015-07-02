var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry');

var EventSource = module.exports = bookshelf.Model.extend({
	tableName: 'event_sources',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:event_sources:name:Name is already taken.' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('eventSourceId')) {
				model.set('eventSourceId', stringService.generateId());
			}
		});
	},

	generatedId: function() {
		return this.get('eventSourceId');
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	eventSourceTemplate: function() {
		return this.belongsTo(modelRegistry.eventSourceTemplate);
	}
});
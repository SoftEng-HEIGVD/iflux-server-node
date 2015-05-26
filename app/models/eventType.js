var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry');

var EventType = module.exports = bookshelf.Model.extend({
	tableName: 'event_types',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:event_source_templates:name:Name is already taken.' ],
		eventTypeSchema: [ 'required' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('eventTypeId')) {
				model.set('eventTypeId', stringService.generateId());
			}
		});
	},

	eventSourceTemplate: function() {
		return this.belongsTo(modelRegistry.eventSourceTemplate);
	}
});
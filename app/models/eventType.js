var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry');

var EventType = module.exports = bookshelf.Model.extend({
	tableName: 'event_types',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:event_types:name:Name is already taken.' ],
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

	generatedId: function() {
		return this.get('eventTypeId');
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	}
});
var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry');

var EventType = module.exports = bookshelf.Model.extend({
	tableName: 'event_types',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:event_types:name:Name is already taken.' ],
		eventTypeSchema: [ 'required' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('generatedIdentifier')) {
				model.set('generatedIdentifier', stringService.generateId());
			}
		});
	},

	generatedId: function() {
		return this.get('generatedIdentifier');
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	}
});
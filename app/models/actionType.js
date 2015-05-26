var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry');

var ActionType = module.exports = bookshelf.Model.extend({
	tableName: 'action_types',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:action_types:name:Name is already taken.' ],
		actionTypeSchema: [ 'required' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('actionTypeId')) {
				model.set('actionTypeId', stringService.generateId());
			}
		});
	},

	actionTargetTemplate: function() {
		return this.belongsTo(modelRegistry.actionTargetTemplate);
	}
});
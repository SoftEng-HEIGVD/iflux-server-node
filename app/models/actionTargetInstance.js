var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry');

var ActionTargetInstance = module.exports = bookshelf.Model.extend({
	tableName: 'action_target_instances',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:action_target_instances:name:Name is already taken.' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('actionTargetInstanceId')) {
				model.set('actionTargetInstanceId', stringService.generateId());
			}
		});
	},

	generatedId: function() {
		return this.get('actionTargetInstanceId');
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	actionTargetTemplate: function() {
		return this.belongsTo(modelRegistry.actionTargetTemplate);
	}
});
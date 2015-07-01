var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry');

var ActionTarget = module.exports = bookshelf.Model.extend({
	tableName: 'action_targets',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:5', 'unique:action_targets:[name, action_target_template_id]:Name is already taken for this action target template.' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('actionTargetId')) {
				model.set('actionTargetId', stringService.generateId());
			}
		});
	},

	generatedId: function() {
		return this.get('actionTargetId');
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	actionTargetTemplate: function() {
		return this.belongsTo(modelRegistry.actionTargetTemplate);
	}
});
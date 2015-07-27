var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry'),
	modelEnricher = require('./utils/modelEnricher');

var EventType = module.exports = bookshelf.Model.extend({
	tableName: 'event_types',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:event_types:[name, organization_id]:Name is already taken in this organization.' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('generatedIdentifier')) {
				model.set('generatedIdentifier', stringService.generateId());
			}
		});

		modelEnricher.addOrganizationEventHandlers(this);
	},

	generatedId: function() {
		return this.get('generatedIdentifier');
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	}
});
var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry'),
	modelEnricher = require('./utils/modelEnricher');

var EventSource = module.exports = bookshelf.Model.extend({
	tableName: 'event_sources',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:event_sources:[name, event_source_template_id, organization_id]:Name is already taken for this event source template and this organization.' ]
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
	},

	eventSourceTemplate: function() {
		return this.belongsTo(modelRegistry.eventSourceTemplate);
	}
});
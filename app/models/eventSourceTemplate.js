var
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	modelEnricher = require('./utils/modelEnricher');

var EventSourceTemplate = module.exports = bookshelf.Model.extend({
	tableName: 'event_source_templates',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:event_source_templates:[name, organization_id]:Name is already taken in this organization.' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		modelEnricher.addOrganizationEventHandlers(this);
	},

  increaseReferenceCount: function(options) {
 		this.set('refCount', this.get('refCount') + 1);

 		options = _.defaults(options || {}, { save: true });

 		if (options.save && this.get('id')) {
 			return this.save();
 		}
 	},

 	decreaseReferenceCount: function(options) {
 		this.set('refCount', this.get('refCount') - 1);

 		options = _.defaults(options || {}, { save: true });

 		if (options.save && this.get('id')) {
 			return this.save();
 		}
 	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	},

	eventTypes: function() {
		return this.hasMany(modelRegistry.eventType);
	},

	eventSources: function() {
		return this.hasMany(modelRegistry.eventSource)
	}
});
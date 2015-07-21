var
  _ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	modelEnricher = require('./utils/modelEnricher');

var ActionTargetTemplate = module.exports = bookshelf.Model.extend({
	tableName: 'action_target_templates',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:action_target_templates:[name, organization_id]:Name is already taken in this organization.' ]
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

	actionTypes: function() {
		return this.hasMany(modelRegistry.actionType);
	},

	actionTargets: function() {
		return this.hasMany(modelRegistry.actionTarget)
	}
});
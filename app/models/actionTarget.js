var
	bookshelf = require('../../config/bookshelf'),
	stringService = require('../services/stringService'),
	modelRegistry = require('../services/modelRegistry'),
	modelEnricher = require('./utils/modelEnricher');

var ActionTarget = module.exports = bookshelf.Model.extend({
	tableName: 'action_targets',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:action_targets:[name, action_target_template_id, organization_id]:Name is already taken for this action target template and this organization.' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('creating', function(model, attrs, options) {
			if (!model.get('generatedIdentifier')) {
				model.set('generatedIdentifier', stringService.generateId());
			}
		});

    this.on('created', function(model, attrs, options) {
      if (model.get('action_target_template_id')) {
        model.actionTargetTemplate()
          .fetch()
          .then(function(actionTargetTemplate) {
            return actionTargetTemplate.increaseReferenceCount();
          });
      }
    });

    this.on('destroying', function(model, attrs, options) {
      if (model.get('action_target_template_id')) {
        model.actionTargetTemplate()
          .fetch()
          .then(function(actionTargetTemplate) {
            return actionTargetTemplate.decreaseReferenceCount();
          });
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

	actionTargetTemplate: function() {
		return this.belongsTo(modelRegistry.actionTargetTemplate);
	}
});
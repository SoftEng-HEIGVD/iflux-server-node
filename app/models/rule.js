var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	modelRegistry = require('../services/modelRegistry'),
	Promise  = require('bluebird'),
	Handlebars = require('handlebars');

/**
 * A Rule is defined by an event type, a list of conditions (evaluated against the event properties)
 * and an action. When an event is notified, if its type matches the one of the rule and if the conditions
 * are met, then the action is triggered.
 *
 * @constructor
 * @param {object} ruleDefinition - the rule definition (used as a payload in the REST requests)
 */
var Rule = module.exports = bookshelf.Model.extend({
	tableName: 'rules',
	hasTimestamps: true,

	validations: {
		name: [ 'required', 'minLength:3', 'unique:rules:name:Name is already taken.' ]
	},

	constructor: function() {
		bookshelf.Model.apply(this, arguments);

		this.on('saving', function(model, attrs, options) {
			if (!_.isString(model.get('conditions'))) {
				model.set('conditions', JSON.stringify(model.get('conditions')));
			}

			if (!_.isString(model.get('transformations'))) {
				model.set('transformations', JSON.stringify(model.get('transformations')));
			}
		});
	},

	organization: function() {
		return this.belongsTo(modelRegistry.organization);
	}
});

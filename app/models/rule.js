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
	},

	/**
	* This function evaluates a rule against an event. If the rule is evaluated positivey, then
	* an action is added in the actions array argument
	* @param {object} event - the incoming event that might trigger the rule
	* @param {array} actions - an array of actions; if the evaluation is positive, an action is added to this array
	*/
	evaluate: Promise.method(function(event, actions) {
	  console.log("Evaluating rule: " + this.get('description'));
	  /*
	   * 1. Check the condition on the event source
	   */
		console.log("Try to match Event source [condition event source: %s -- event source: %s]", this.get('condition').source, event.source);
		if ("*" !== this.get('condition').source && event.source !== this.get('condition').source) {
	    return;
	  }

	  /*
	   * 2. Check the condition on the event type
	   */
		console.log("Try to match Event condition [condition event type: %s -- event type: %s]", this.get('condition').eventType, event.type);
	  if ("*" !== this.get('condition').eventType && event.type !== this.get('condition').eventType) {
	    return;
	  }

	  /*
	   * 3. Check the conditions on the event properties
	   */

	  /*
	   * All conditions are met, add an action to trigger
	   */
		console.log("All conditions are met to register the action");
	  var action = this.createConcreteAction(event);
		if (action !== null) {
			console.log("Action registered.");
			actions.push(action);
		}
	}),

	createConcreteAction: function(event) {
		try {
			var transformation = Handlebars.compile(this.get('action').actionSchema);
			var action = transformation(event);
			var actionObject = JSON.parse(action);

			return {
				target: this.get('action').target,
				payload: actionObject
			};
		}
		catch (err) {
			console.log(err);
			return null;
		}
	}
});

var
	Handlebars = require('handlebars'),
	mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * A Rule is defined by an event type, a list of conditions (evaluated against the event properties)
 * and an action. When an event is notified, if its type matches the one of the rule and if the conditions
 * are met, then the action is triggered.
 *
 * @constructor
 * @param {object} ruleDefinition - the rule definition (used as a payload in the REST requests)
 */
var ruleSchema = new Schema({
  description: String,
	reference: String,
	enabled: Boolean,
	condition: {
		source: String,
		eventType: String,
		properties: Schema.Types.Mixed
	},
	action: {
		target: String,
		actionSchema: String
	}
});

/**
* This function evaluates a rule against an event. If the rule is evaluated positivey, then
* an action is added in the actions array argument
* @param {object} event - the incoming event that might trigger the rule
* @param {array} actions - an array of actions; if the evaluation is positive, an action is added to this array
*/
ruleSchema.methods.evaluate = function(event, actions) {
  console.log("Evaluating rule: " + this.description);
  /*
   * 1. Check the condition on the event source
   */
	console.log("Try to match Event source [condition event source: %s -- event source: %s]", this.condition.source, event.source);
	if ("*" !== this.condition.source && event.source !== this.condition.source) {
    return;
  }

  /*
   * 2. Check the condition on the event type
   */
	console.log("Try to match Event condition [condition event type: %s -- event type: %s]", this.condition.eventType, event.type);
  if ("*" !== this.condition.eventType && event.type !== this.condition.eventType) {
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
};

ruleSchema.methods.createConcreteAction = function(event) {
	try {
		var transformation = Handlebars.compile(this.action.actionSchema);
		var action = transformation(event);
		var actionObject = JSON.parse(action);

		return {
			target: this.action.target,
			payload: actionObject
		};
	}
	catch (err) {
		console.log(err);
		return null;
	}
};


mongoose.model('Rule', ruleSchema);

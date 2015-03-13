var
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
	condition: { type: Schema.Types.ObjectId, ref: 'Condition' },
	action: { type: Schema.Types.ObjectId, ref: 'Action' }
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
  if ("*" !== this.condition.source && event.source !== this.condition.source) {
    console.log("Event source does not match, exit evaluation [condition event source: %s -- event source: %s]", this.condition.source, event.source);
    return;
  }

  /*
   * 2. Check the condition on the event type
   */
  if ("*" !== this.condition.type && event.type !== this.condition.type) {
    console.log("Event type does not match, exit evaluation [condition event type: %s -- event type: %s]", this.condition.type, event.type);
    return;
  }

  /*
   * 3. Check the conditions on the event properties
   */

  /*
   * All conditions are met, add an action to trigger
   */
	console.log("All conditions are met to register the action");
  var action = this.action.createConcreteAction(event);
	if (action !== null) {
		console.log("Action registered.");
		actions.push(action);
	}
}

mongoose.model('Rule', ruleSchema);

var
	_ = require('underscore'),
	ruleDao = require('../persistence/ruleDao'),
	actionService = require('./actionService');

/**
 * This constructor will be used to create and export a singleton. The Rule Engine maintains a list of rules and
 * a list of actions. When events are notified, the Rule Engine is asked to evaluate the rules to decide whether
 * actions should be triggered.
 */
module.exports = {
	/**
  * Processes an event, by evaluating the list of rules
  *
  * @param {object} event - the incoming event that might trigger some rules
  * @returns {array} a list of actions to execute in reaction to the event occurrence
  */
	processEvent: function (event) {
		return ruleDao
			.findAllEnabled()
			.then(function (rules) {
				var actions = [];

				_.each(rules, function(rule) {
					rule.evaluate(event, actions);
				});


				console.log("process actions");
				actionService.processActions(actions);
			});
	}
};

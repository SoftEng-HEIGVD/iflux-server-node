var safeEval = require('notevil');

module.exports = {
	/**
	 * Create function dynamically based on a given expression to evaluate as conditions.
	 *
	 * @param expression The expression
	 * @returns {Function} The function created from the expression
	 */
	createConditionFn: function(expression) {
		return safeEval.Function('event', 'eventSourceInstance', 'eventType', 'options', expression);
	},

	/**
	 * Create function dynamically on a given expression to do transformations.
	 *
	 * @param expression The expression
	 * @returns {Function} The function created from the expression
	 */
	createTransformationFn: function(expression) {
		return safeEval.Function('event', 'actionTargetInstance', 'actionType', 'eventSourceInstance', 'eventType', 'options', expression);
	},

	/**
	 * Evaluate a condition dynamically from an expression, parameters and sample event
	 *
	 * @param expression The function expression
	 * @param eventSourceInstance The event source instance
	 * @param eventType The event type
	 * @param sample The sample event
	 * @returns {Boolean} Result of the expression evaluation
	 */
	evaluateCondition: function(expression, eventSourceInstance, eventType, sample) {
		return this.createConditionFn(expression)(sample, eventSourceInstance, eventType, { json: JSON, console: console });
	},

	/**
	 * Evaluate a transformation dynamically from an expression, parameters and sample event.
	 *
	 * @param expression The function expression
	 * @param actionTargetInstance The action target instance
	 * @param actionType The action type
	 * @param eventSourceInstance The event source instance
	 * @param eventType The event type
	 * @param sample The sample event
	 * @returns {*} Result of the expression evaluation
	 */
	evaluateTransformation: function(expression, actionTargetInstance, actionType, eventSourceInstance, eventType, sample) {
		return this.createTransformationFn(expression)(sample, actionTargetInstance, actionType, eventSourceInstance, eventType, { json: JSON, console: console });
	}
};
var
	safeEval = require('notevil'),
	ruleEngineConverter = require('../converters/ruleEngineConverter');

module.exports = {
	/**
	 * Create function dynamically based on a given expression to evaluate as conditions.
	 *
	 * @param expression The expression
	 * @returns {Function} The function created from the expression
	 */
	createConditionFn: function(expression) {
		return safeEval.Function('event', 'eventSource', 'eventType', 'options', expression);
	},

	/**
	 * Create function dynamically on a given expression to do transformations.
	 *
	 * @param expression The expression
	 * @returns {Function} The function created from the expression
	 */
	createTransformationFn: function(expression) {
		return safeEval.Function('event', 'actionTarget', 'actionType', 'eventSource', 'eventType', 'options', expression);
	},

	/**
	 * Evaluate a condition dynamically from an expression, parameters and sample event
	 *
	 * @param expression The function expression
	 * @param eventSource The event source
	 * @param eventType The event type
	 * @param sample The sample event
	 * @returns {Boolean} Result of the expression evaluation
	 */
	evaluateCondition: function(expression, eventSource, eventType, sample) {
		return this.createConditionFn(expression)(
			sample,
			ruleEngineConverter.convertEventSource(eventSource),
			ruleEngineConverter.convertEventType(eventType),
			{
				json: JSON, console: console
			});
	},

	/**
	 * Evaluate a transformation dynamically from an expression, parameters and sample event.
	 *
	 * @param expression The function expression
	 * @param actionTarget The action target
	 * @param actionType The action type
	 * @param eventSource The event source
	 * @param eventType The event type
	 * @param sample The sample event
	 * @returns {*} Result of the expression evaluation
	 */
	evaluateTransformation: function(expression, actionTarget, actionType, eventSource, eventType, sample) {
		return this.createTransformationFn(expression)(
			sample,
			ruleEngineConverter.convertActionTarget(actionTarget),
			ruleEngineConverter.convertActionType(actionType),
			ruleEngineConverter.convertEventSource(eventSource),
			ruleEngineConverter.convertEventType(eventType),
			{
				json: JSON, console: console
			});
	}
};
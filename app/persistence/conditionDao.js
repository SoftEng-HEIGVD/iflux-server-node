var
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Condition = mongoose.model('Condition'),
	dao = require('./dao');

module.exports = {
	/**
	 * Create and save a condition
	 *
	 * @param conditionDefinition The condition definition to create the document
	 * @returns {Promise} A promise
	 */
	createAndSave: function(conditionDefinition) {
		var condition = new Condition({
			source: conditionDefinition.eventSource,
			type: conditionDefinition.eventType,
			properties: conditionDefinition.eventProperties
		});

		return dao.save(condition);
	}
}
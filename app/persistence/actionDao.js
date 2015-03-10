var
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Action = mongoose.model('Action'),
	dao = require('./dao');

module.exports = {
	/**
	 * Create and save an action
	 *
	 * @param actionDefinition Action definition to create the action document
	 * @returns {Promise} A promise
	 */
	createAndSave: function(actionDefinition) {
		var action = new Action({
			target: actionDefinition.actionTarget,
			actionSchema: actionDefinition.actionSchema
		});

		return dao.save(action);
	}
}
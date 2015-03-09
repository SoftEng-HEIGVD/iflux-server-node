var
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Action = mongoose.model('Action'),
	dao = require('./dao');

module.exports = {
	createAndSave: function(actionDefinition) {
		var action = new Action({
			target: actionDefinition.actionTarget,
			actionSchema: actionDefinition.actionSchema
		});

		return dao.save(action);
	}
}
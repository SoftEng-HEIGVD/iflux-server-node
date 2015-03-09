var
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Condition = mongoose.model('Condition'),
	dao = require('./dao');

module.exports = {
	createAndSave: function(conditionDefinition) {
		var condition = new Condition({
			source: conditionDefinition.eventSource,
			type: conditionDefinition.eventType,
			properties: conditionDefinition.eventProperties
		});

		return dao.save(condition);
	}
}
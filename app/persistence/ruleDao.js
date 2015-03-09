var
	_ = require('underscore'),
	Q = require('q'),
	mongoose = require('mongoose'),
	Rule = mongoose.model('Rule'),
	dao = require('./dao'),
	actionDao = require('./actionDao'),
	conditionDao = require('./conditionDao');

module.exports = {
	createAndSave: function(ruleDefinition) {
		var action = null;

		return Q(actionDao.createAndSave(ruleDefinition.then))
			.then(function(actionSaved) {
				action = actionSaved;

				return conditionDao.createAndSave(ruleDefinition.if);
			})
			.then(function(conditionSaved) {
				var rule = new Rule({
					description: ruleDefinition.description,
					condition: conditionSaved,
					action: action
				});

				return dao.save(rule);
			});
	}
}
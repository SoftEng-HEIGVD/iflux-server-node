var
	_ = require('underscore'),
	Q = require('q'),
	mongoose = require('mongoose'),
	Rule = mongoose.model('Rule'),
	dao = require('./dao'),
	actionDao = require('./actionDao'),
	conditionDao = require('./conditionDao');

module.exports = {
	/**
	 * Create a new rule and save it to mongo
	 *
	 * @param ruleDefinition The rule definition to create the document
	 * @returns {Promise} A promise
	 */
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
					enabled: true,
					condition: conditionSaved,
					action: action
				});

				return dao.save(rule);
			});
	},

	/**
	 * Find a rule by its id
	 *
	 * @param id The id of the rule
	 * @returns {Promise} A promise
	 */
	findById: function(id) {
		return Rule
			.findById(id)
			.populate('condition action')
			.exec();
	},

	/**
	 * Find all the rules
	 *
	 * @returns {Promise} A promise
	 */
	findAllEanbled: function() {
		return Rule
			.find({ enabled: true })
			.populate('condition action')
			.exec();
	}
}
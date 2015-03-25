var
	_ = require('underscore'),
	Q = require('q'),
	mongoose = require('mongoose'),
	Rule = mongoose.model('Rule'),
	dao = require('./dao');

module.exports = {
	/**
	 * Create a new rule and save it to mongo
	 *
	 * @param ruleDefinition The rule definition to create the document
	 * @returns {Promise} A promise
	 */
	createAndSave: function(ruleDefinition) {
		var rule = new Rule({
			description: ruleDefinition.description,
			reference: ruleDefinition.reference,
			enabled: true,
			condition: {
				source: ruleDefinition.if.eventSource,
				eventType: ruleDefinition.if.eventType,
				properties: ruleDefinition.if.eventProperties
			},
			action: {
				target: ruleDefinition.then.actionTarget,
				actionSchema: ruleDefinition.then.actionSchema
			}
		});

		return dao.save(rule);
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
			.exec();
	},

	/**
	 * Find rules by reference
	 *
	 * @param reference Reference of the rule
	 * @returns {Promise} A promise
	 */
	findByReference: function(reference) {
		return Rule
			.find({ reference: reference })
			.exec();
	},

	/**
	 * Find all the enabled rules
	 *
	 * @returns {Promise} A promise
	 */
	findAll: function() {
		return Rule
			.find()
			.exec();
	},

	/**
	 * Find all the enabled rules
	 *
	 * @returns {Promise} A promise
	 */
	findAllEnabled: function() {
		return Rule
			.find({ enabled: true })
			.exec();
	}
};
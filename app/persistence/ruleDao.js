var
	_ = require('underscore'),
	Rule = require('../models/models').rule,
	dao = require('./dao');

module.exports = _.extend(new dao(Rule), {
	/**
	 * Create a new rule and save it to the databae
	 *
	 * @param ruleDefinition The rule definition to create the document
	 * @returns {Promise} A promise
	 */
	createAndSave: function(ruleDefinition) {
		var rule = new this.model({
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

		return this.save(rule);
	},

	/**
	 * Find rules by reference
	 *
	 * @param reference Reference of the rule
	 * @returns {Promise} A promise
	 */
	findByReference: function(reference) {
		return this.model.where({ reference: reference }).fetch();
	},

	/**
	 * Find all the enabled rules
	 *
	 * @returns {Promise} A promise
	 */
	findAllEnabled: function() {
		return this.model.where({ enabled: true }).fetchAll().then(function(result) {
			return result.models;
		});
	}
});
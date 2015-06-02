var
	_ = require('underscore'),
	Rule = require('../services/modelRegistry').rule,
	dao = require('./dao');

module.exports = _.extend(new dao(Rule), {
	/**
	 * Create a new rule and save it to the databae
	 *
	 * @param ruleDefinition The rule definition to create the document
	 * @param organization The organization where to assign the rule
	 * @returns {Promise} A promise
	 */
	createAndSave: function(ruleDefinition, organization) {
		var rule = new this.model({
			organization_id: organization.get('id'),
			name: ruleDefinition.name,
			description: ruleDefinition.description,
			active: ruleDefinition.active,
			conditions: ruleDefinition.conditions,
			transformations: ruleDefinition.transformations
		});

		return this.save(rule);
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('organizations', 'rules.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('rules.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

	findByOrganization: function(organization) {
		return this.collectionFromRelation(organization.rules());
	},

	findAllByUser: function(user) {
		return this.collection(function(qb) {
			return qb
				.leftJoin('organizations', 'rules.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));
		});
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
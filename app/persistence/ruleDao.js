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

	findByOrganization: function(organization, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'rules.organization_id', 'organizations.id')
				.where('organizations.id', organization.get('id'));

			if (criteria.name) {
				qb = qb.where('rules.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	findAllByUser: function(user, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('organizations', 'rules.organization_id', 'organizations.id')
				.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
				.where('organizations_users.user_id', user.get('id'));

			if (criteria.name) {
				qb = qb.where('rules.name', 'like', criteria.name);
			}

			return qb;
		});
	},

	/**
	 * Find all the enabled rules
	 *
	 * @returns {Promise} A promise
	 */
	findAllEnabled: function() {
		return this.model.where({ active: true }).fetchAll().then(function(result) {
			return result.models;
		});
	},

	/**
	 * Count the number of rules where the event type appears at least once in condition or transformation
	 *
	 * @param eventType The event type to lookup
	 */
	countEventTypeUsed: function(eventType) {
		return this.knex.raw(
			'select count(distinct id) ' +
			'from rules r, json_array_elements(r.conditions) condition, json_array_elements(r.transformations) transformation ' +
			"where condition->'eventType'->>'id' = '" + eventType.get('id') + "' or transformation->'eventType'->>'id' = '" + eventType.get('id') + "'"
		);
	},

	/**
	 * Count the number of rules where the action type appears at least once in transformation
	 *
	 * @param actionType The action type to lookup
	 */
	countActionTypeUsed: function(actionType) {
		return this.knex.raw(
			'select count(distinct id) ' +
			'from rules r, json_array_elements(r.transformations) transformation ' +
			"where transformation->'actionType'->>'id' = '" + actionType.get('id') + "'"
		)
	},

	/**
	 * Count the number of rules where the event source appears at least once in condition
	 *
	 * @param eventSource The action type to lookup
	 */
	countEventSourceUsed: function(eventSource) {
		return this.knex.raw(
			'select count(distinct id) ' +
			'from rules r, json_array_elements(r.conditions) condition ' +
			"where condition->'eventSource'->>'id' = '" + eventSource.get('id') + "'"
		)
	},

	/**
	 * Count the number of rules where the action target appears at least once in transformation
	 *
	 * @param actionTarget The action target to lookup
	 */
	countActionTarget: function(actionTarget) {
		return this.knex.raw(
			'select count(distinct id) ' +
			'from rules r, json_array_elements(r.transformations) transformation ' +
			"where transformation->'actionTarget'->>'id' = '" + actionTarget.get('id') + "'"
		)
	}
});
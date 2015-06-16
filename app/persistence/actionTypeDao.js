var
	_ = require('underscore'),
	ActionType = require('../services/modelRegistry').actionType,
	dao = require('./dao');

module.exports = _.extend(new dao(ActionType), {
	/**
	 * Create a new action type
	 *
	 * @param actionTargetTemplate The action target template to associate
	 * @param actionType The action type to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(actionType, actionTargetTemplate) {
		var data = {
			name: actionType.name,
			description: actionType.description,
			actionTypeSchema: actionType.schema,
			action_target_template_id: actionTargetTemplate.id
		};

		return new this.model(data).save();
	},

	findByIdAndUser: function(id, user) {
		return this.model
			.query(function(qb) {
				return qb
					.leftJoin('action_target_templates', 'action_types.action_target_template_id', 'action_target_templates.id')
					.leftJoin('organizations', 'action_target_templates.organization_id', 'organizations.id')
					.leftJoin('organizations_users', 'organizations.id', 'organizations_users.organization_id')
					.where('action_types.id', id)
					.where('organizations_users.user_id', user.get('id'));
			})
			.fetch({require: true});
	},

	findByActionTargetTemplate: function(actionTargetTemplate, criteria) {
		return this.collection(function(qb) {
			qb = qb
				.leftJoin('action_target_templates', 'action_types.action_target_template_id', 'action_target_templates.id')
				.where('action_types.action_target_template_id', actionTargetTemplate.get('id'));

			if (criteria.name) {
				qb = qb.where('action_types.name', 'like', criteria.name);
			}

			return qb;
		});
	}
});
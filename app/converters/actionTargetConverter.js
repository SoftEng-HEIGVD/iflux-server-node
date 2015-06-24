var _ = require('underscore');

module.exports = {
	convert: function(actionTarget) {
		var data = {
			id: actionTarget.get('id'),
			actionTargetId: actionTarget.get('actionTargetId'),
			name: actionTarget.get('name'),
			actionTargetTemplateId: actionTarget.get('action_target_template_id'),
			organizationId: actionTarget.get('organization_id')
		};

		if (actionTarget.get('configuration')) {
			data.configuration = actionTarget.get('configuration');
		}

		return data;
	}
};
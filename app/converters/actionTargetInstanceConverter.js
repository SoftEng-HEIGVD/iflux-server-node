var _ = require('underscore');

module.exports = {
	convert: function(actionTargetInstance) {
		var data = {
			id: actionTargetInstance.get('id'),
			name: actionTargetInstance.get('name'),
			actionTargetTemplateId: actionTargetInstance.get('action_target_template_id'),
			organizationId: actionTargetInstance.get('organization_id')
		};

		if (actionTargetInstance.get('configuration')) {
			data.configuration = actionTargetInstance.get('configuration');
		}

		return data;
	}
};
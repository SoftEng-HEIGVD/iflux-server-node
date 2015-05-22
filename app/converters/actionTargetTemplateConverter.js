var _ = require('underscore');

module.exports = {
	convert: function(actionTargetTemplate) {
		var data = {
			id: actionTargetTemplate.get('id'),
			name: actionTargetTemplate.get('name'),
			public: actionTargetTemplate.get('public'),
			organizationId: actionTargetTemplate.get('organization_id'),
			target: {
				url: actionTargetTemplate.get('targetUrl'),
				token: actionTargetTemplate.get('targetToken')
			}
		};

		if (actionTargetTemplate.get('configurationSchema')) {
			data = _.extend(data, {
				configuration: {
					schema: actionTargetTemplate.get('configurationSchema'),
					url: actionTargetTemplate.get('configurationUrl'),
					token: actionTargetTemplate.get('configurationToken')
				}
			});
		}

		if (actionTargetTemplate.get('configurationUi')) {
			data = _.extend(data, { configurationUi: actionTargetTemplate.get('configurationUi') });
		}

		return data;
	}
};
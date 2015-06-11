var _ = require('underscore');

module.exports = {
	convert: function(eventSourceTemplate) {
		var data = {
			id: eventSourceTemplate.get('id'),
			name: eventSourceTemplate.get('name'),
			public: eventSourceTemplate.get('public'),
			organizationId: eventSourceTemplate.get('organization_id')
		};

		if (eventSourceTemplate.get('configurationSchema')) {
			data = _.extend(data, {
				configuration: {
					schema: eventSourceTemplate.get('configurationSchema'),
					url: eventSourceTemplate.get('configurationUrl'),
					token: eventSourceTemplate.get('configurationToken')
				}
			});
		}

		if (eventSourceTemplate.get('configurationUi')) {
			data = _.extend(data, { configurationUi: eventSourceTemplate.get('configurationUi') });
		}

		return data;
	}
};
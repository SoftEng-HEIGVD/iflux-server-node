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
					callbackUrl: eventSourceTemplate.get('callbackUrl'),
					callbackToken: eventSourceTemplate.get('callbackToken')
				}
			});
		}

		return data;
	}
};
var _ = require('underscore');

module.exports = {
	convert: function(eventSource) {
		var data = {
			id: eventSource.get('id'),
			generatedIdentifier: eventSource.get('generatedIdentifier'),
			name: eventSource.get('name'),
			eventSourceTemplateId: eventSource.get('event_source_template_id'),
			organizationId: eventSource.get('organization_id')
		};

		if (eventSource.get('configuration')) {
			data.configuration = eventSource.get('configuration');
		}

		return data;
	}
};
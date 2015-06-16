var _ = require('underscore');

module.exports = {
	convert: function(eventSourceInstance) {
		var data = {
			id: eventSourceInstance.get('id'),
			eventSourceInstanceId: eventSourceInstance.get('eventSourceInstanceId'),
			name: eventSourceInstance.get('name'),
			eventSourceTemplateId: eventSourceInstance.get('event_source_template_id'),
			organizationId: eventSourceInstance.get('organization_id')
		};

		if (eventSourceInstance.get('configuration')) {
			data.configuration = eventSourceInstance.get('configuration');
		}

		return data;
	}
};
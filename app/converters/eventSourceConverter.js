var _ = require('underscore');

module.exports = {
	convert: function(model) {
		var data = {
			id: model.get('id'),
			generatedIdentifier: model.get('generatedIdentifier'),
			name: model.get('name'),
			eventSourceTemplateId: model.get('event_source_template_id'),
			organizationId: model.get('organization_id'),
      deletable: model.get('refCount') == 0
		};

		if (model.get('configuration')) {
			data.configuration = model.get('configuration');
		}

		return data;
	}
};
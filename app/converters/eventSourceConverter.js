var
  _ = require('underscore'),
  refCountService = require('../services/refCountService');

module.exports = {
	convert: function(model) {
		var data = {
			id: model.get('id'),
			generatedIdentifier: model.get('generatedIdentifier'),
			name: model.get('name'),
			eventSourceTemplateId: model.get('event_source_template_id'),
			organizationId: model.get('organization_id'),
      public: model.get('public'),
      deletable: refCountService.isDeletable(model)
		};

		if (model.get('configuration')) {
			data.configuration = model.get('configuration');
		}

		return data;
	}
};
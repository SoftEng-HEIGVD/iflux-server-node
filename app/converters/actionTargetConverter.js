var _ = require('underscore');

module.exports = {
	convert: function(model) {
		var data = {
			id: model.get('id'),
			generatedIdentifier: model.get('generatedIdentifier'),
			name: model.get('name'),
			actionTargetTemplateId: model.get('action_target_template_id'),
			organizationId: model.get('organization_id'),
      public: model.get('public'),
      deletable: model.get('refCount') == 0
		};

		if (model.get('configuration')) {
			data.configuration = model.get('configuration');
		}

		return data;
	}
};
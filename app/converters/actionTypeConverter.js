var
  _ = require('underscore'),
  refCountService = require('../services/refCountService');

module.exports = {
	convert: function(model) {
		return {
			id: model.get('id'),
			type: model.get('type'),
			public: model.get('public'),
			name: model.get('name'),
			description: model.get('description'),
			organizationId: model.get('organization_id'),
      deletable: refCountService.isDeletable(model),
			schema: model.get('actionTypeSchema')
		};
	}
};
var
  _ = require('underscore'),
  refCountService = require('../services/refCountService');

module.exports = {
	convert: function(model) {
		var data = {
			id: model.get('id'),
			name: model.get('name'),
			public: model.get('public'),
			organizationId: model.get('organization_id'),
      deletable: refCountService.isDeletable(model)
		};

		if (model.get('configurationSchema')) {
			data = _.extend(data, {
				configuration: {
					schema: model.get('configurationSchema'),
					url: model.get('configurationUrl'),
					token: model.get('configurationToken')
				}
			});
		}

		if (model.get('configurationUi')) {
			data = _.extend(data, { configurationUi: model.get('configurationUi') });
		}

		return data;
	}
};
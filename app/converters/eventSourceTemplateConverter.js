var _ = require('underscore');

module.exports = {
	convert: function(model) {
		var data = {
			id: model.get('id'),
			name: model.get('name'),
			public: model.get('public'),
			organizationId: model.get('organization_id'),
      deletable: model.get('refCount') == 0
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
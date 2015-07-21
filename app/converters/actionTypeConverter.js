var _ = require('underscore');

module.exports = {
	convert: function(model) {
		return {
			id: model.get('id'),
			type: model.get('type'),
			public: model.get('public'),
			name: model.get('name'),
			description: model.get('description'),
			organizationId: model.get('organization_id'),
      deletable: model.get('refCount') == 0,
			schema: model.get('actionTypeSchema')
		};
	}
};
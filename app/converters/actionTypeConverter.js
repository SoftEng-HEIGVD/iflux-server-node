var _ = require('underscore');

module.exports = {
	convert: function(actionType) {
		return {
			id: actionType.get('id'),
			type: actionType.get('type'),
			public: actionType.get('public'),
			name: actionType.get('name'),
			description: actionType.get('description'),
			organizationId: actionType.get('organization_id'),
			schema: actionType.get('actionTypeSchema')
		};
	}
};
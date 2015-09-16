var refCountService = require('../services/refCountService');

module.exports = {
	convert: function(model) {
		return {
			id: model.get('id'),
			name: model.get('name'),
			deletable: refCountService.isDeletable(model)
		};
	}
};
module.exports = {
	convert: function(model) {
		return {
			id: model.get('id'),
			name: model.get('name'),
			deletable: model.get('refCount') == 0
		};
	}
};
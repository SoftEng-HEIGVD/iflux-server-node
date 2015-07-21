module.exports = {
	convert: function(model) {
		return {
			id: model.get('id'),
			firstName: model.get('firstName'),
			lastName: model.get('lastName')
		};
	}
};
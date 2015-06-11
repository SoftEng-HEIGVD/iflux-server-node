module.exports = {
	convert: function(organizationModel) {
		return {
			id: organizationModel.get('id'),
			name: organizationModel.get('name')
		};
	}
};
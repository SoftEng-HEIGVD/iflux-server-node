module.exports = {
	convert: function(organizationModel) {
		return {
			id: organizationModel.get('id'),
			name: organizationModel.get('name'),
			deletable: organizationModel.get('refCount') == 0
		};
	}
};
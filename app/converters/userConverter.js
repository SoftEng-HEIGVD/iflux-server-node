module.exports = {
	convert: function(userModel) {
		return {
			id: userModel.get('id'),
			firstName: userModel.get('firstName'),
			lastName: userModel.get('lastName')
		};
	}
};
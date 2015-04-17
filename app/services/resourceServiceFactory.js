var s = require('underscore.string');

module.exports = function(basePath) {
	return {
		basePath: s.rtrim(basePath, '/'),

		location: function(res, status, obj) {
			return res.status(status).location(this.basePath + '/' + obj.get('id'));
		},

		ok: function(res, obj) {
			return res.status(200).json(obj);
		},

		notFound: function(res) {
			return res.status(404);
		},

		unauthorized: function(res) {
			return res.status(401);
		},

		validationError: function(res, error) {
			return res.status(422).json(error.errors);
		}
	}
};
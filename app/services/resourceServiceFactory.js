var s = require('underscore.string');

module.exports = function(basePath) {
	return {
		basePath: s.rtrim(basePath, '/'),

		location: function(res, status, obj, prefixPath) {
			if (prefixPath) {
				if (!s.endsWith(prefixPath, '/')) {
					prefixPath += '/';
				}
				if (!s.startsWith(prefixPath, '/')) {
					prefixPath += '/';
				}
				return res.status(status).location(this.basePath + prefixPath + obj.get('id'));
			}
			else {
				return res.status(status).location(this.basePath + '/' + obj.get('id'));
			}
		},

		customLocation: function(res, status, location) {
			return res.status(status).location(location);
		},

		ok: function(res, obj) {
			return res.status(200).json(obj);
		},

		notFound: function(res, message) {
			if (message) {
				return res
					.status(404)
					.json({
						message: message
					})
					.end();
			}
			else {
				return res.status(404).end();
			}
		},

		unauthorized: function(res) {
			return res.status(401);
		},

		forbiden: function(res) {
			return res.status(403);
		},

		validationError: function(res, error) {
			if (error.errors) {
				return res.status(422).json(error.errors);
			}
			else {
				return res.status(422).json(error);
			}
		}
	}
};
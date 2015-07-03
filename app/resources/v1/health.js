var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	pkg = require('../../../package.json');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

router.route('/health')
	.get(function(req, res, next) {
		res.status(200).json({ version: pkg.version });
	});

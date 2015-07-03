var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	pkg = require('../../../package.json'),
	resourceService = require('../../services/resourceServiceFactory')('/health');;

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

router.route('/')
	.get(function(req, res, next) {
		res.status(200).json({ version: pkg.version });
	});

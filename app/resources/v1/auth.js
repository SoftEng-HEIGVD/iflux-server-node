var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	userDao = require('../../persistence/userDao'),
	securityService = require('../../services/securityService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/auth');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

function convertUser(user) {
	return {
		id: user.get('id'),
		firstName: user.get('firstName'),
		lastName: user.get('lastName')
	};
}

router.route('/signin')
	.post(function(req, res, next) {
		userDao
			.findBy({ email: req.body.email })
			.then(function(user) {
				return res.json({ result: securityService.verify(req.body.password, user.get('passwordHash')) }).end();
			})
			.catch(userDao.model.NotFoundError, function(err) {
				return resourceService.unauthorized(res);
			});
	});
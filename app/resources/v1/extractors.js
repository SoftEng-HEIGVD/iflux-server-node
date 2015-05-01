var
	organizationDao = require('../../persistence/organizationDao');

module.exports = {
	organization: function(req, res, next) {
		if (req.organization) {
			return next();
		}
		else {
			return organizationDao
				.findById(req.params.orgId)
				.then(function (organization) {
					req.organization = organization;
					return next();
				})
				.catch(organizationDao.model.NotFoundError, function (err) {
					return res.status(404).json({ message: 'Organization not found' });
				});
		}
	},

	organizationScopedToUser: function(req, res, next) {
		if (req.organization) {
			return next();
		}
		else {
			return organizationDao
				.findByIdAndUser(req.params.orgId, req.userModel)
				.then(function (organization) {
					req.organization = organization;
					return next();
				})
				.catch(organizationDao.model.NotFoundError, function (err) {
					return res.status(404).json({ message: 'Organization not found' });
				});
		}
	}
};
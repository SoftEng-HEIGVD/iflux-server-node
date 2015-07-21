var
	_ = require('underscore'),
	s = require('underscore.string');

module.exports = function(basePath) {
	return {
		basePath: s.rtrim(basePath, '/'),

		location: function(res, status, obj, prefixPath) {
			if (obj.generatedId) {
				res.set('x-iflux-generated-id', obj.generatedId());
			}

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
			if (obj) {
				return res.status(200).json(obj);
			}
			else {
				return res.status(200);
			}
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

		deleted: function(res) {
			return res.status(204);
		},

		serverError: function(res, err) {
			return res.status(500).json(err);
		},

		notAuthorized: function(res) {
			return res.status(401);
		},

		forbidden: function(res) {
			return res.status(403);
		},

		deleteForbidden: function(res, name) {
			return res.status(403).json({ message: 'The ' + name + ' cannot be deleted. The model is referenced by other models.' });
		},

		validationError: function(res, error) {
			if (error.errors) {
				return res.status(422).json(error.errors);
			}
			else {
				return res.status(422).json(error);
			}
		},

    manageDelete: function(res, model, modelName, countFn) {
      var resourceService = this;

      // Model is referenced
  		if (model.get('refCount') > 0) {
  			return resourceService.deleteForbidden(res, modelName).end();
  		}
      else {
        return countFn(model)
     				.then(function(realCount) {
              // 0 means the same as before but directly retrieved from the DB and not from the cached field in the orga.
              if (realCount > 0) {
                console.log(
                  'There is a mismatch with the cached refCount: %s and the realRefCount: %s for the %s: %s',
                  model.get('refCount'), realCount, modelName, model.get('id')
                );
                return resourceService.deleteForbidden(res, modelName).end();
              }
              else {
                return model
                  .destroy()
                  .then(function () {
                    return resourceService.deleted(res).end();
                  })
                  .error(function (err) {
                    if (err.stack) {
                      console.log(err);
                    }

                    return resourceService.serverError(res, {message: err.message}).end();
                  });
              }
          });
      }
    }
	}
};
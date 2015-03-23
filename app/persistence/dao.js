var
	Q = require('q');

module.exports = {
	/**
	 * Save a model through the Mongoose API
	 *
	 * @param obj The model to save
	 * @returns {Promise} A promise
	 */
	save: function(obj) {
		return Q.Promise(function(resolve, reject) {
			obj.save(function(err, objSaved) {
				if (err) {
					reject(err);
				}
				else {
					resolve(objSaved);
				}
			});
		});
	}
};
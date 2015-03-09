var
	Q = require('q');

module.exports = {
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
}
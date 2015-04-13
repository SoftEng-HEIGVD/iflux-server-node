var modelClasses = {}

var models = require('require-directory')(module, '.');

for(var modelName in models) {
	modelClasses[modelName] = models[modelName];
}

module.exports = modelClasses;
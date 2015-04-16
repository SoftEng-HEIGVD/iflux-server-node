var modelRegistry = require ('../services/modelRegistry');

var models = require('require-directory')(module, '.');

for(var modelName in models) {
	modelRegistry[modelName] = models[modelName];
}

module.exports = modelRegistry;
/**
 * # Inversion of control
 */
var
	ioc = require('electrolyte'),
	path = require('path');

ioc.loader(ioc.node(__dirname));
ioc.loader(ioc.node(path.join(__dirname, '..', 'app', 'services')));

ioc.loader(function(id) {
  if (id.match(/^\./)) {
    return undefined;
  }

  try {
    var dep = require(id);
    return function() {
      return dep;
    };
  } catch (e) {
    return undefined;
  }
});

module.exports = ioc;

var
	_ = require('underscore');

module.exports = {
  isDeletable: function(model) {
    return _.isNull(model.get('refCount')) || _.isUndefined(model.get('refCount')) || model.get('refCount') == 0;
  }
};

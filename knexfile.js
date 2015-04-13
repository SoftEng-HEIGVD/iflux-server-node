var
	config = require('./config/config'),
	env = process.env.NODE_ENV || 'development';

cfg = {};
cfg[env] = config.knex;

module.exports = cfg;
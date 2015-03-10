var path = require('path'),
	rootPath = path.normalize(__dirname + '/..'),
	dotenv = require('dotenv'),
	env = process.env.NODE_ENV || 'development';

dotenv.load();

var config = {
  development: {
    root: rootPath,
		baseUrl: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
		siteUrl: process.env.IFLUX_SITE_URL || 'http://www.iflux.io',
    app: {
      name: 'iFLUX-Server'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/' + (process.env.MONGO_DB || 'iflux-server-dev')
  },

  test: {
    root: rootPath,
		baseUrl: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
		siteUrl: process.env.IFLUX_SITE_URL || 'http://www.iflux.io',
		app: {
      name: 'iFLUX-Server'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/' + (process.env.MONGO_DB || 'iflux-server-test')
  },

  production: {
    root: rootPath,
		baseUrl: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
		siteUrl: process.env.IFLUX_SITE_URL || 'http://www.iflux.io',
    app: {
      name: 'iFLUX-Server'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/'  + (process.env.MONGO_DB || 'iflux-server-prod')
  },

	docker: {
		root: rootPath,
		baseUrl: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
		siteUrl: process.env.IFLUX_SITE_URL || 'http://www.iflux.io',
		app: {
			name: 'iFLUX-Server'
		},
		port: process.env.PORT || 3000,
		db: 'mongodb://mongo:' + process.env.MONGO_PORT_27017_TCP_PORT + '/' + (process.env.MONGO_DB || 'iflux-server-docker')
	}
};

module.exports = config[env];

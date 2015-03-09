var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'iFLUX-Server'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/' + (process.env.MONGO_DB || 'iflux-server-dev')
  },

  test: {
    root: rootPath,
    app: {
      name: 'iFLUX-Server'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/' + (process.env.MONGO_DB || 'iflux-server-test')
  },

  production: {
    root: rootPath,
    app: {
      name: 'iFLUX-Server'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/'  + (process.env.MONGO_DB || 'iflux-server-prod')
  },

	docker: {
		root: rootPath,
		app: {
			name: 'iFLUX-Server'
		},
		port: process.env.PORT || 3000,
		db: 'mongodb://mongo:' + process.env.MONGO_PORT_27017_TCP_PORT + '/' + (process.env.MONGO_DB || 'iflux-server-docker')
	}
};

module.exports = config[env];

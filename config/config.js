var path = require('path'),
	rootPath = path.normalize(__dirname + '/..'),
	dotenv = require('dotenv'),
	env = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV != 'docker') {
	dotenv.load();
}

var config = {
  development: {
    root: rootPath,
		baseUrl: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
		siteUrl: process.env.IFLUX_SITE_URL || 'http://www.iflux.io',
    app: {
      name: 'iFLUX-Server',
			jwtSecret: process.env.JWT_SECRET
    },
    port: process.env.PORT || 3000,
	  host: process.env.HOST || 'localhost',
		knex: {
			client: 'pg',
			connection: 	{
				host: 'localhost',
				post: 5432,
				user: 'ifluxsrv',
				password: 'ifluxsrv',
				database: 'iflux-server-dev',
				charset: 'utf-8'
			},
			pool: {
				min: 2,
				max: 10
			},
			migrations: {
				tableName: 'migrations',
				directory: './db/migrations'
			},
			seeds: {
				directory: './db/seeds'
			}
		}
  },

  test: {
    root: rootPath,
		baseUrl: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
		siteUrl: process.env.IFLUX_SITE_URL || 'http://www.iflux.io',
		app: {
      name: 'iFLUX-Server',
			jwtSecret: process.env.JWT_SECRET
    },
    port: process.env.PORT || 3001,
	  host: process.env.HOST || 'localhost',
		knex: {
			client: 'pg',
			connection: 	{
				host: 'localhost',
				port: 5432,
				user: 'ifluxsrv',
				password: 'ifluxsrv',
				database: 'iflux-server-test',
				charset: 'utf-8'
			},
			pool: {
				min: 2,
				max: 10
			},
			migrations: {
				tableName: 'migrations',
				directory: './db/migrations'
			},
			seeds: {
				directory: './db/seeds'
			}
		}
  },

  production: {
    root: rootPath,
		baseUrl: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
		siteUrl: process.env.IFLUX_SITE_URL || 'http://www.iflux.io',
    app: {
      name: 'iFLUX-Server',
			jwtSecret: process.env.JWT_SECRET
    },
    port: process.env.PORT || 3000,
	  host: process.env.HOST || 'localhost',
		knex: {
			client: 'pg',
			connection: 	{
				host: 'localhost',
				port: 5432,
				user: process.env.DB_USER,
				password: process.env.DB_PASS,
				database: (process.env.DB_NAME || 'iflux-server-prod'),
				charset: 'utf-8'
			},
			pool: {
				min: 2,
				max: 10
			},
			migrations: {
				tableName: 'migrations',
				directory: './db/migrations'
			},
			seeds: {
				directory: './db/seeds'
			}
		}
  },

	docker: {
		root: rootPath,
		baseUrl: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
		siteUrl: process.env.IFLUX_SITE_URL || 'http://www.iflux.io',
		app: {
			name: 'iFLUX-Server',
			jwtSecret: process.env.JWT_SECRET
		},
		port: 3000,
		host: process.env.HOST || 'localhost',
		knex: {
			client: 'pg',
			connection: 	{
				host: process.env.POSTGRES_PORT_5432_TCP_ADDR,
				port: process.env.POSTGRES_PORT_5432_TCP_PORT,
				user: process.env.DB_USER,
				password: process.env.DB_PASS,
				database: process.env.DB_NAME,
				charset: 'utf-8'
			},
			pool: {
				min: 2,
				max: 10
			},
			migrations: {
				tableName: 'migrations',
				directory: './db/migrations'
			},
			seeds: {
				directory: './db/seeds'
			}
		}
	}
};

module.exports = config[env];

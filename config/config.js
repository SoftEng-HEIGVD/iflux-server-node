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
    app: {
      name: 'iFLUX-Server',
			jwtSecret: process.env.IFLUX_SERVER_JWT_SECRET
    },
    port: process.env.PORT || 3000,
	  host: process.env.HOST || 'localhost',
	  mockServer: {
		  serverPort: 1080
	  },
	  elasticSearch: {
			enable: true,
		  host: process.env.ELASTICSEARCH_HOST,
		  port: process.env.ELASTICSEARCH_PORT
	  },
	  kafka: {
		  enable: process.env.KAFKA_ENABLE === 'true',
		  connectionString: process.env.KAFKA_ZOOKEEPER_HOST + ':' + process.env.KAFKA_ZOOKEEPER_PORT,
		  clientId: 'iflux-kafka',
		  eventTopic: 'iflux-events'
	  },
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
		baseUrl: process.env.IFLUX_SERVER_URL,
		app: {
      name: 'iFLUX-Server',
			jwtSecret: process.env.IFLUX_SERVER_JWT_SECRET,
			debug: process.env.DEBUG || false
    },
    port: process.env.PORT || 3002,
	  host: process.env.HOST || 'localhost',
	  mockServer: {
		  serverPort: 1080
	  },
	  elasticSearch: {
			enable: true,
		  host: process.env.ELASTICSEARCH_HOST,
		  port: process.env.ELASTICSEARCH_PORT
	  },
	  kafka: {
		  enable: false,
		  connectionString: process.env.KAFKA_ZOOKEEPER_HOST + ':' + process.env.KAFKA_ZOOKEEPER_PORT,
		  clientId: 'iflux-kafka',
      eventTopic: 'iflux-events'
	  },
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
    app: {
      name: 'iFLUX-Server',
			jwtSecret: process.env.IFLUX_SERVER_JWT_SECRET
    },
    port: process.env.PORT || 3000,
	  host: process.env.HOST || 'localhost',
	  elasticSearch: {
			enable: true,
		  host: process.env.ELASTICSEARCH_HOST,
		  port: process.env.ELASTICSEARCH_PORT
	  },
	  kafka: {
		  enable: process.env.KAFKA_ENABLE === 'true',
		  connectionString: process.env.KAFKA_ZOOKEEPER_HOST + ':' + process.env.KAFKA_ZOOKEEPER_PORT,
		  clientId: 'iflux-kafka',
      eventTopic: 'iflux-events'
	  },
		knex: {
			client: 'pg',
			connection: 	{
				host: 'localhost',
				port: 5432,
				user: process.env.IFLUX_PG_DB_USER,
				password: process.env.IFLUX_PG_DB_PASS,
				database: (process.env.IFLUX_PG_DB_NAME || 'iflux-server-prod'),
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
		app: {
			name: 'iFLUX-Server',
			jwtSecret: process.env.IFLUX_SERVER_JWT_SECRET
		},
		port: 3000,
		host: process.env.HOST || 'localhost',
		elasticSearch: {
			enable: true,
		  host: process.env.ES_PORT_9200_TCP_ADDR,
		  port: process.env.ES_PORT_9200_TCP_PORT
	  },
		kafka: {
			enable: process.env.KAFKA_ENABLE === 'true',
		  connectionString: process.env.ZK_PORT_2181_TCP_ADDR + ':' + process.env.ZK_PORT_2181_TCP_PORT,
		  clientId: 'iflux-kafka',
      eventTopic: 'iflux-events'
	  },
		knex: {
			client: 'pg',
			connection: 	{
				host: process.env.POSTGRESQL_PORT_5432_TCP_ADDR,
				port: process.env.POSTGRESQL_PORT_5432_TCP_PORT,
				user: process.env.IFLUX_PG_DB_USER,
				password: process.env.IFLUX_PG_DB_PASS,
				database: process.env.IFLUX_PG_DB_NAME,
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

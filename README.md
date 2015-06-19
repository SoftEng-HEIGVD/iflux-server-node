# iflux-server-node
Node.js implementation of the iFLUX APIs

## Development setup

Create a `.env` file in the root directory of the project and put the following content:

```bash
IFLUX_SERVER_JWT_SECRET=<LongRandomStringThatMustBeSecret>

# Kakfa
KAFKA_ZOOKEEPER_HOST=<Boot2Docker IP>
KAFKA_ZOOKEEPER_PORT=2181

# ElasticSearch
ELASTICSEARCH_HOST=<Boot2Docker IP>
ELASTICSEARCH_PORT=9200

#############################
# ONLY USED TO RUN API TESTS
#############################
IFLUX_SERVER_URL=http://localhost:3000

```

### Mandatory

It's highly recommended to use `Docker` to simplify your environment setup. Refers to this [iFLUX Docker](https://github.com/SoftEng-HEIGVD/iflux-docker) repository. 

| Name                       | Description                               |
| -------------------------- | ----------------------------------------- |
| IFLUX_SERVER_JWT_SECRET    | Must be a random string that will be used to cipher the JSON Web Tokens. |
| KAFKA_ZOOKEEPER_HOST       | Should be the Docker host IP (boot2docker IP, Vagrant VM IP, ...) or the IP of your host if you have installed Kafka manually. |
| KAFKA_ZOOKEEPER_PORT       | Default port is 2181. |
| ELASTICSEARCH_HOST         | Should be the Docker host IP (boot2docker IP, Vagrant VM IP, ...) or the IP of your host if you have installed ElasticSearch manually. |
| ELASTICSEARCH_PORT         | Default port is 9200. |

### Optional

| Name                       | Description                               |
| -------------------------- | ----------------------------------------- |
| IFLUX_SERVER_URL           | If you want to run the custom API tests, you need to do configure the iFLUX Server URL. |

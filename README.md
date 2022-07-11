# Esset agent

This agent fetches data from Esset's FTP.

# CSV File format
 TODO: Doc
# Custom configuration

The following configuration options must be specified using the agent core configuration mechansim, i.e. they should be added to the same configuration file.

```yaml
# Agent configuration
esset:
  ftp:
    host: ftp_host
    port: 21
    username: username
    password: pwd 
  dataFetching:
    dontProcessDataOlderThan: 60  #In Minutes
    fileNameDatePattern: yyyymmddHH # fileName pattern matching
  fileParser:
    delimiter: ;
```

# Installation & containerization

As of Feb. 11, 2021, the Agent Core library is not published to a private package registry and the ESSET agent relies on having it pre-installed locally.

Expressions between `<` and `>` in the instructions below should be replaced with actual values.

## Basic installation

To access `@gads-citron` packages registry add the following code to your `.npmrc` :

```bash
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
@gads-citron:registry=https://npm.pkg.github.com
```
[Check this for more informations](https://docs.github.com/en/packages/guides/configuring-npm-for-use-with-github-packages)

```bash
git clone <esset-agent.git> esset-agent && cd esset-agent
yarn install && yarn build
```



## Run without Docker

Follow the installation steps and then inside the `esset-agent` directory:
```bash
AGENT_CONFIG_PATH=</path/to/your/config.yml> node dist/index.js
```

## Create a Docker image

Follow the installation steps and then inside the `esset-agent` directory:
```bash
docker build -t esset-agent -f Dockerfile .. # Use two dots, this is not a typo
```

## Run with Docker

```bash
docker run --rm \
            -p 8086:8086 \
            -v </absolute/path/to/your/config.yml>:/app/dist/config.yml:ro esset-agent
```

Note: you can omit the `-p` argument if monitoring is turned off.

Configuration requirements:
* `monitoring.port` must be the same port as the one exposed in the Dockerfile and the `docker` command
* `monitoring.hostname` should be `0.0.0.0` to make the monitoring server reachable from outside the container


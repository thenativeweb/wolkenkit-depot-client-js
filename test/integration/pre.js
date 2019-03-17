'use strict';

const path = require('path');

const oneLine = require('common-tags/lib/oneLine'),
      request = require('axios'),
      retry = require('async-retry'),
      shell = require('shelljs');

const pre = async function () {
  /* eslint-disable no-process-env */
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  /* eslint-enable no-process-env */

  const dockerFileDirectory = path.join(__dirname, '..', 'shared', 'docker');

  shell.exec(oneLine`
    docker build
      -t thenativeweb/test-depot
      ${dockerFileDirectory}
  `, { cwd: dockerFileDirectory });

  shell.exec(oneLine`
    docker run
      -d
      -p 3000:3000
      -p 3333:3333
      -e "API_CORS_ORIGIN=*"
      -e "HTTP_PORT=3000"
      -e "IDENTITYPROVIDERS=[{\\"issuer\\":\\"https://auth.thenativeweb.io\\",\\"certificate\\":\\"/wolkenkit/app/keys\\"}]"
      --name test-depot-integration
      thenativeweb/test-depot:latest
  `, { cwd: dockerFileDirectory });

  await retry(async () => {
    await request({ method: 'get', url: 'http://localhost:3333/v1/status' });
  });
};

module.exports = pre;

'use strict';

const fs = require('fs'),
      path = require('path');

const Limes = require('limes');

const limes = new Limes({
  identityProviders: [
    new Limes.IdentityProvider({
      issuer: 'https://auth.thenativeweb.io',
      /* eslint-disable no-sync */
      privateKey: fs.readFileSync(path.join(__dirname, '..', 'shared', 'docker', 'keys', 'privateKey.pem')),
      certificate: fs.readFileSync(path.join(__dirname, '..', 'shared', 'docker', 'keys', 'certificate.pem'))
      /* eslint-enable no-sync */
    })
  ]
});

const issueToken = async function (subject, payload) {
  const token = await limes.issueToken({ issuer: 'https://auth.thenativeweb.io', subject, payload });

  return token;
};

module.exports = issueToken;

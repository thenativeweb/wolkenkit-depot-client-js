'use strict';

const shell = require('shelljs');

const post = async function () {
  shell.exec([
    'docker kill test-depot-integration; docker rm -v test-depot-integration'
  ].join(';'));
};

module.exports = post;

'use strict';

const path = require('path');

const webpack = require('webpack');

const buildDistribution = function () {
  return new Promise((resolve, reject) => {
    const compiler = webpack({
      bail: true,
      entry: path.join(__dirname, '..', '..', 'src', 'DepotClient.js'),
      output: {
        path: path.resolve(__dirname, '..', 'integration', 'frontend'),
        filename: 'DepotClient.browser.js',
        library: 'DepotClient',
        libraryTarget: 'umd'
      },
      target: 'web'
    });

    compiler.run(err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

module.exports = buildDistribution;

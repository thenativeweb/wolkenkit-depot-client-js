'use strict';

const Depot = require('./Depot');

const depotClientCache = {};

const depotClient = {
  async connect ({ host, port = 443, token = '' }) {
    if (!host) {
      throw new Error('Host is missing.');
    }

    const cacheKey = `${host}:${port}:${token}`;

    let depot = depotClientCache[cacheKey];

    if (depot) {
      return depot;
    }

    depot = new Depot({ host, port, token });
    depotClientCache[cacheKey] = depot;

    return depot;
  }
};

module.exports = depotClient;

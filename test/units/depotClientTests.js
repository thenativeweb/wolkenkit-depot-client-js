'use strict';

const assert = require('assertthat');

const Depot = require('../../src/Depot'),
      depotClient = require('../../src/depotClient');

suite('depotClient', () => {
  test('is an object.', async () => {
    assert.that(depotClient).is.ofType('object');
  });

  suite('connect', () => {
    test('is a function.', async () => {
      assert.that(depotClient.connect).is.ofType('function');
    });

    test('throws an error if host is missing.', async () => {
      await assert.that(async () => {
        await depotClient.connect({});
      }).is.throwingAsync('Host is missing.');
    });

    test('returns a depot.', async () => {
      const depot = await depotClient.connect({ host: 'localhost' });

      assert.that(depot).is.instanceOf(Depot);
    });

    test('returns different depots for different hosts.', async () => {
      const depot1 = await depotClient.connect({ host: 'localhost' });
      const depot2 = await depotClient.connect({ host: 'wolkenkit.io' });

      assert.that(depot1).is.not.sameAs(depot2);
    });

    test('returns the same depot if the hosts are identical.', async () => {
      const depot1 = await depotClient.connect({ host: 'localhost' });
      const depot2 = await depotClient.connect({ host: 'localhost' });

      assert.that(depot1).is.sameAs(depot2);
    });

    test('returns different depots for different ports.', async () => {
      const depot1 = await depotClient.connect({ host: 'localhost', port: 443 });
      const depot2 = await depotClient.connect({ host: 'localhost', port: 3000 });

      assert.that(depot1).is.not.sameAs(depot2);
    });

    test('returns the same depot if the hosts and ports are identical.', async () => {
      const depot1 = await depotClient.connect({ host: 'localhost', port: 443 });
      const depot2 = await depotClient.connect({ host: 'localhost', port: 443 });

      assert.that(depot1).is.sameAs(depot2);
    });

    test('returns different depots for different tokens.', async () => {
      const depot1 = await depotClient.connect({ host: 'localhost', port: 443, token: 'token1' });
      const depot2 = await depotClient.connect({ host: 'localhost', port: 443, token: 'token2' });

      assert.that(depot1).is.not.sameAs(depot2);
    });

    test('returns the same depot if the hosts, ports and tokens are identical.', async () => {
      const depot1 = await depotClient.connect({ host: 'localhost', port: 443, token: 'token' });
      const depot2 = await depotClient.connect({ host: 'localhost', port: 443, token: 'token' });

      assert.that(depot1).is.sameAs(depot2);
    });
  });
});

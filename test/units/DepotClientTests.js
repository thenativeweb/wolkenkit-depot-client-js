'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const DepotClient = require('../../src/DepotClient');

suite('DepotClient', () => {
  test('is a function.', async () => {
    assert.that(DepotClient).is.ofType('function');
  });

  test('throws an error if an invalid protocol is given.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new DepotClient({ protocol: 'unknown' });
      /* eslint-enable no-new */
    }).is.throwing('Invalid protocol.');
  });

  test('throws an error if host is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new DepotClient({});
      /* eslint-enable no-new */
    }).is.throwing('Host is missing.');
  });

  suite('instance', () => {
    let depotClient;

    setup(() => {
      depotClient = new DepotClient({
        host: 'localhost',
        port: 443,
        token: ''
      });
    });

    suite('addBlob', () => {
      test('is a function.', async () => {
        assert.that(depotClient.addBlob).is.ofType('function');
      });

      test('throws an error if content is missing.', async () => {
        await assert.that(async () => {
          await depotClient.addBlob({});
        }).is.throwingAsync('Content is missing.');
      });

      test('throws an error if file name is missing.', async () => {
        await assert.that(async () => {
          await depotClient.addBlob({ content: {}});
        }).is.throwingAsync('File name is missing.');
      });
    });

    suite('getBlob', () => {
      test('is a function.', async () => {
        assert.that(depotClient.getBlob).is.ofType('function');
      });

      test('throws an error if id is missing.', async () => {
        await assert.that(async () => {
          await depotClient.getBlob({});
        }).is.throwingAsync('Id is missing.');
      });
    });

    suite('removeBlob', () => {
      test('is a function.', async () => {
        assert.that(depotClient.removeBlob).is.ofType('function');
      });

      test('throws an error if id is missing.', async () => {
        await assert.that(async () => {
          await depotClient.removeBlob({});
        }).is.throwingAsync('Id is missing.');
      });
    });

    suite('transferOwnership', () => {
      test('is a function.', async () => {
        assert.that(depotClient.transferOwnership).is.ofType('function');
      });

      test('throws an error if id is missing.', async () => {
        await assert.that(async () => {
          await depotClient.transferOwnership({});
        }).is.throwingAsync('Id is missing.');
      });

      test('throws an error if to is missing.', async () => {
        const id = uuid();

        await assert.that(async () => {
          await depotClient.transferOwnership({ id });
        }).is.throwingAsync('To is missing.');
      });
    });

    suite('authorize', () => {
      test('is a function.', async () => {
        assert.that(depotClient.authorize).is.ofType('function');
      });

      test('throws an error if id is missing.', async () => {
        await assert.that(async () => {
          await depotClient.authorize({});
        }).is.throwingAsync('Id is missing.');
      });

      test('throws an error if is authorized is missing.', async () => {
        const id = uuid();

        await assert.that(async () => {
          await depotClient.authorize({ id });
        }).is.throwingAsync('Is authorized is missing.');
      });
    });
  });
});

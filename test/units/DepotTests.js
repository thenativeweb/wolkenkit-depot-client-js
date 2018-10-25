'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const Depot = require('../../src/Depot');

suite('Depot', () => {
  test('is a function.', async () => {
    assert.that(Depot).is.ofType('function');
  });

  test('throws an error if host is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Depot({});
      /* eslint-enable no-new */
    }).is.throwing('Host is missing.');
  });

  test('throws an error if port is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Depot({ host: 'localhost' });
      /* eslint-enable no-new */
    }).is.throwing('Port is missing.');
  });

  test('throws an error if token is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Depot({ host: 'localhost', port: 443 });
      /* eslint-enable no-new */
    }).is.throwing('Token is missing.');
  });

  suite('instance', () => {
    let depot;

    setup(() => {
      depot = new Depot({
        host: 'localhost',
        port: 443,
        token: ''
      });
    });

    suite('addBlob', () => {
      test('is a function.', async () => {
        assert.that(depot.addBlob).is.ofType('function');
      });

      test('throws an error if stream is missing.', async () => {
        await assert.that(async () => {
          await depot.addBlob({});
        }).is.throwingAsync('Stream is missing.');
      });

      test('throws an error if file name is missing.', async () => {
        await assert.that(async () => {
          await depot.addBlob({ stream: {}});
        }).is.throwingAsync('File name is missing.');
      });
    });

    suite('getBlob', () => {
      test('is a function.', async () => {
        assert.that(depot.getBlob).is.ofType('function');
      });

      test('throws an error if id is missing.', async () => {
        await assert.that(async () => {
          await depot.getBlob({});
        }).is.throwingAsync('Id is missing.');
      });
    });

    suite('removeBlob', () => {
      test('is a function.', async () => {
        assert.that(depot.removeBlob).is.ofType('function');
      });

      test('throws an error if id is missing.', async () => {
        await assert.that(async () => {
          await depot.removeBlob({});
        }).is.throwingAsync('Id is missing.');
      });
    });

    suite('transferOwnership', () => {
      test('is a function.', async () => {
        assert.that(depot.transferOwnership).is.ofType('function');
      });

      test('throws an error if id is missing.', async () => {
        await assert.that(async () => {
          await depot.transferOwnership({});
        }).is.throwingAsync('Id is missing.');
      });

      test('throws an error if to is missing.', async () => {
        const id = uuid();

        await assert.that(async () => {
          await depot.transferOwnership({ id });
        }).is.throwingAsync('To is missing.');
      });
    });

    suite('authorize', () => {
      test('is a function.', async () => {
        assert.that(depot.authorize).is.ofType('function');
      });

      test('throws an error if id is missing.', async () => {
        await assert.that(async () => {
          await depot.authorize({});
        }).is.throwingAsync('Id is missing.');
      });

      test('throws an error if is authorized is missing.', async () => {
        const id = uuid();

        await assert.that(async () => {
          await depot.authorize({ id });
        }).is.throwingAsync('Is authorized is missing.');
      });
    });
  });
});

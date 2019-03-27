'use strict';

const fs = require('fs'),
      path = require('path'),
      { Readable } = require('stream');

const assert = require('assertthat'),
      uuid = require('uuidv4');

const DepotClient = require('../../src/DepotClient'),
      issueToken = require('./issueToken');

const getUpload = function () {
  const dataPath = path.join(__dirname, '..', 'shared', 'data', 'wolkenkit.png');
  const content = fs.createReadStream(dataPath);

  return {
    fileName: 'wolkenkit.png',
    contentType: 'image/png',
    content
  };
};

suite('Node.js', () => {
  let depot;

  setup(async () => {
    depot = new DepotClient({
      protocol: 'http',
      host: 'localhost',
      port: 3000,
      token: await issueToken('Jane Doe')
    });
  });

  suite('addFile', () => {
    test('returns the id.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });

      assert.that(uuid.is(id)).is.true();
    });

    test('uses the given id.', async () => {
      const id = uuid();
      const { content, fileName } = getUpload();
      const returnedId = await depot.addFile({ id, content, fileName });

      assert.that(returnedId).is.equalTo(id);
    });

    /* eslint-disable mocha/no-skipped-tests */
    test.skip('emits progress events.', async () => {
      const id = uuid();
      const { content, fileName } = getUpload();

      const progressEvents = [];

      depot.on(`progress::${id}`, progressEvent => {
        progressEvents.push(progressEvent);
      });

      await depot.addFile({ id, content, fileName });

      assert.that(progressEvents.length).is.atLeast(1);

      const lastProgressEvent = progressEvents[progressEvents.length - 1];

      assert.that(lastProgressEvent.type).is.equalTo('upload');
      assert.that(lastProgressEvent.progress).is.equalTo(100);
      assert.that(lastProgressEvent.elapsedTime).is.atLeast(1);
      assert.that(lastProgressEvent.estimatedRemainingTime).is.equalTo(0);
    });
    /* eslint-enable mocha/no-skipped-tests */

    test('throws an error if the user is not authorized to add files.', async () => {
      depot = new DepotClient({
        protocol: 'http',
        host: 'localhost',
        port: 3000
      });

      const { content, fileName } = getUpload();

      await assert.that(async () => {
        await depot.addFile({ content, fileName });
      }).is.throwingAsync('Authentication required.');
    });
  });

  suite('getFile', () => {
    test('returns the file.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });

      const file = await depot.getFile({ id });

      file.content.resume();

      assert.that(file.content).is.instanceOf(Readable);
      assert.that(file.fileName).is.equalTo(fileName);
      assert.that(file.contentType).is.equalTo('application/octet-stream');
    });

    test('returns the file with the specified content type.', async () => {
      const { content, fileName, contentType } = getUpload();
      const id = await depot.addFile({ content, fileName, contentType });

      const file = await depot.getFile({ id });

      file.content.resume();

      assert.that(file.contentType).is.equalTo(contentType);
    });

    /* eslint-disable mocha/no-skipped-tests */
    test.skip('emits progress events.', async () => {
      const id = uuid();
      const { content, fileName } = getUpload();

      await depot.addFile({ id, content, fileName });

      const progressEvents = [];

      depot.on(`progress::${id}`, progressEvent => {
        progressEvents.push(progressEvent);
      });

      await depot.getFile({ id });

      assert.that(progressEvents.length).is.atLeast(1);

      const lastProgressEvent = progressEvents[progressEvents.length - 1];

      assert.that(lastProgressEvent.type).is.equalTo('download');
      assert.that(lastProgressEvent.progress).is.equalTo(100);
      assert.that(lastProgressEvent.elapsedTime).is.atLeast(1);
      assert.that(lastProgressEvent.estimatedRemainingTime).is.equalTo(0);
    });
    /* eslint-enable mocha/no-skipped-tests */

    test('throws an error if the specified file does not exist.', async () => {
      const id = uuid();

      await assert.that(async () => {
        await depot.getFile({ id });
      }).is.throwingAsync('File not found.');
    });

    test('throws an error if the user is not authorized to get a file.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });

      const depotOther = new DepotClient({
        protocol: 'http',
        host: 'localhost',
        port: 3000
      });

      await assert.that(async () => {
        await depotOther.getFile({ id });
      }).is.throwingAsync('Authentication required.');
    });

    suite('asDataUrl', () => {
      test('returns the data url.', async () => {
        const { content, fileName, contentType } = getUpload();
        const id = await depot.addFile({ content, fileName, contentType });

        const file = await depot.getFile({ id });
        const dataUrl = await file.asDataUrl();

        assert.that(dataUrl).is.startingWith('data:image/png;base64,iVBORw0KGgoAAAAN');
        assert.that(dataUrl).is.endingWith('AAAASUVORK5CYII=');
      });
    });
  });

  suite('removeFile', () => {
    test('removes the file.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });

      await assert.that(async () => {
        await depot.removeFile({ id });
      }).is.not.throwingAsync();

      await assert.that(async () => {
        await depot.getFile({ id });
      }).is.throwingAsync('File not found.');
    });

    test('throws an error if the specified file does not exist.', async () => {
      const id = uuid();

      await assert.that(async () => {
        await depot.removeFile({ id });
      }).is.throwingAsync('File not found.');
    });

    test('throws an error if the user is not authorized to remove a file.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });

      const depotOther = new DepotClient({
        protocol: 'http',
        host: 'localhost',
        port: 3000
      });

      await assert.that(async () => {
        await depotOther.removeFile({ id });
      }).is.throwingAsync('Authentication required.');
    });
  });

  suite('transferOwnership', () => {
    test('transfers the ownership.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });

      await assert.that(async () => {
        await depot.transferOwnership({ id, to: uuid() });
      }).is.not.throwingAsync();

      await assert.that(async () => {
        await depot.getFile({ id });
      }).is.throwingAsync('Authentication required.');
    });

    test('throws an error if the specified file does not exist.', async () => {
      const id = uuid();

      await assert.that(async () => {
        await depot.transferOwnership({ id, to: uuid() });
      }).is.throwingAsync('File not found.');
    });

    test('throws an error if the user is not authorized to transfer the ownership.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });

      const depotOther = new DepotClient({
        protocol: 'http',
        host: 'localhost',
        port: 3000
      });

      await assert.that(async () => {
        await depotOther.transferOwnership({ id, to: uuid() });
      }).is.throwingAsync('Authentication required.');
    });
  });

  suite('authorize', () => {
    test('authorizes the file.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });
      const isAuthorized = {
        queries: {
          getFile: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await depot.authorize({ id, isAuthorized });
      }).is.not.throwingAsync();

      const depotPublic = new DepotClient({
        protocol: 'http',
        host: 'localhost',
        port: 3000
      });

      let file;

      await assert.that(async () => {
        file = await depotPublic.getFile({ id });
      }).is.not.throwingAsync();

      file.content.resume();
    });

    test('throws an error if the specified file does not exist.', async () => {
      const id = uuid();
      const isAuthorized = {
        queries: {
          getFile: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await depot.authorize({ id, isAuthorized });
      }).is.throwingAsync('File not found.');
    });

    test('throws an error if the user is not authorized to authorize.', async () => {
      const { content, fileName } = getUpload();
      const id = await depot.addFile({ content, fileName });
      const isAuthorized = {
        queries: {
          getFile: { forPublic: true }
        }
      };

      const depotOther = new DepotClient({
        protocol: 'http',
        host: 'localhost',
        port: 3000
      });

      await assert.that(async () => {
        await depotOther.authorize({ id, isAuthorized });
      }).is.throwingAsync('Authentication required.');
    });
  });
});

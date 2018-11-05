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
  const stream = fs.createReadStream(dataPath);

  return {
    fileName: 'wolkenkit.png',
    contentType: 'image/png',
    stream
  };
};

suite('Node.js', () => {
  let depot;

  setup(async () => {
    depot = new DepotClient({
      host: 'localhost',
      port: 3000,
      token: issueToken('Jane Doe')
    });
  });

  suite('addBlob', () => {
    test('returns the id.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });

      assert.that(uuid.is(id)).is.true();
    });

    test('throws an error if the user is not authorized to add blobs.', async () => {
      depot = new DepotClient({
        host: 'localhost',
        port: 3000
      });

      const { stream, fileName } = getUpload();

      await assert.that(async () => {
        await depot.addBlob({ stream, fileName });
      }).is.throwingAsync('Authentication required.');
    });
  });

  suite('getBlob', () => {
    test('returns the blob.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });

      const blob = await depot.getBlob({ id });

      blob.stream.resume();

      assert.that(blob.stream).is.instanceOf(Readable);
      assert.that(blob.fileName).is.equalTo(fileName);
      assert.that(blob.contentType).is.equalTo('application/octet-stream');
    });

    test('returns the blob with the specified content type.', async () => {
      const { stream, fileName, contentType } = getUpload();
      const id = await depot.addBlob({ stream, fileName, contentType });

      const blob = await depot.getBlob({ id });

      blob.stream.resume();

      assert.that(blob.contentType).is.equalTo(contentType);
    });

    test('throws an error if the specified blob does not exist.', async () => {
      const id = uuid();

      await assert.that(async () => {
        await depot.getBlob({ id });
      }).is.throwingAsync('Blob not found.');
    });

    test('throws an error if the user is not authorized to get a blob.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });

      const depotOther = new DepotClient({
        host: 'localhost',
        port: 3000
      });

      await assert.that(async () => {
        await depotOther.getBlob({ id });
      }).is.throwingAsync('Authentication required.');
    });
  });

  suite('removeBlob', () => {
    test('removes the blob.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });

      await assert.that(async () => {
        await depot.removeBlob({ id });
      }).is.not.throwingAsync();

      await assert.that(async () => {
        await depot.getBlob({ id });
      }).is.throwingAsync('Blob not found.');
    });

    test('throws an error if the specified blob does not exist.', async () => {
      const id = uuid();

      await assert.that(async () => {
        await depot.removeBlob({ id });
      }).is.throwingAsync('Blob not found.');
    });

    test('throws an error if the user is not authorized to remove a blob.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });

      const depotOther = new DepotClient({
        host: 'localhost',
        port: 3000
      });

      await assert.that(async () => {
        await depotOther.removeBlob({ id });
      }).is.throwingAsync('Authentication required.');
    });
  });

  suite('transferOwnership', () => {
    test('transfers the ownership.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });

      await assert.that(async () => {
        await depot.transferOwnership({ id, to: uuid() });
      }).is.not.throwingAsync();

      await assert.that(async () => {
        await depot.getBlob({ id });
      }).is.throwingAsync('Authentication required.');
    });

    test('throws an error if the specified blob does not exist.', async () => {
      const id = uuid();

      await assert.that(async () => {
        await depot.transferOwnership({ id, to: uuid() });
      }).is.throwingAsync('Blob not found.');
    });

    test('throws an error if the user is not authorized to transfer the ownership.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });

      const depotOther = new DepotClient({
        host: 'localhost',
        port: 3000
      });

      await assert.that(async () => {
        await depotOther.transferOwnership({ id, to: uuid() });
      }).is.throwingAsync('Authentication required.');
    });
  });

  suite('authorize', () => {
    test('authorizes the blob.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });
      const isAuthorized = {
        queries: {
          getBlob: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await depot.authorize({ id, isAuthorized });
      }).is.not.throwingAsync();

      const depotPublic = new DepotClient({
        host: 'localhost',
        port: 3000
      });

      let blob;

      await assert.that(async () => {
        blob = await depotPublic.getBlob({ id });
      }).is.not.throwingAsync();

      blob.stream.resume();
    });

    test('throws an error if the specified blob does not exist.', async () => {
      const id = uuid();
      const isAuthorized = {
        queries: {
          getBlob: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await depot.authorize({ id, isAuthorized });
      }).is.throwingAsync('Blob not found.');
    });

    test('throws an error if the user is not authorized to authorize.', async () => {
      const { stream, fileName } = getUpload();
      const id = await depot.addBlob({ stream, fileName });
      const isAuthorized = {
        queries: {
          getBlob: { forPublic: true }
        }
      };

      const depotOther = new DepotClient({
        host: 'localhost',
        port: 3000
      });

      await assert.that(async () => {
        await depotOther.authorize({ id, isAuthorized });
      }).is.throwingAsync('Authentication required.');
    });
  });
});

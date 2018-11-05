'use strict';

/* globals document, FileReader, window */

const fs = require('fs'),
      http = require('http'),
      path = require('path'),
      { promisify } = require('util');

const assert = require('assertthat'),
      puppeteer = require('puppeteer'),
      uuid = require('uuidv4');

const buildDistribution = require('../shared/buildDistribution'),
      getFrontend = require('../shared/getFrontend'),
      issueToken = require('./issueToken');

const readFile = promisify(fs.readFile);

const chooseFileToUpload = async function ({ page }) {
  const dataPath = path.join(__dirname, '..', 'shared', 'data', 'wolkenkit.png');

  const input = await page.$('#file-input');

  await input.uploadFile(dataPath);

  return {
    fileName: 'wolkenkit.png',
    contentType: 'image/png',
    dataPath
  };
};

const createClient = async function (options = {}) {
  window.client = new window.DepotClient({
    host: 'localhost',
    port: 3000,
    token: options.token
  });
};

const selectFileAndAddBlob = async function (options = {}) {
  const fileInput = document.getElementById('file-input');

  const file = fileInput.files[0];

  if (!file) {
    throw new Error('Input not working.');
  }

  return await window.client.addBlob({
    stream: file,
    fileName: 'wolkenkit.png',
    contentType: options.contentType
  });
};

const getBlobAndTransformIntoArray = async function (options = {}) {
  const { stream, fileName, contentType } = await window.client.getBlob({ id: options.id });

  const result = await new Promise((resolve, reject) => {
    const reader = new FileReader();

    try {
      reader.addEventListener('loadend', () => {
        resolve({
          stream: Array.from(new Uint8Array(reader.result)),
          fileName,
          contentType
        });
      });

      reader.readAsArrayBuffer(stream);
    } catch (ex) {
      reject(ex);
    }
  });

  return result;
};

suite('browser', function () {
  this.timeout(60 * 1000);

  let browser,
      page,
      token;

  suiteSetup(async function () {
    this.timeout(30 * 1000);

    const frontend = getFrontend();

    http.createServer(frontend).listen(4000);

    await buildDistribution();
  });

  setup(async () => {
    token = issueToken('Jane Doe');

    browser = await puppeteer.launch({
      ignoreHTTPSErrors: true
    });

    page = await browser.newPage();

    await page.goto('http://localhost:4000/');
  });

  teardown(async () => {
    await browser.close();
  });

  suite('addBlob', () => {
    test('returns the id.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });
      const id = await page.evaluate(selectFileAndAddBlob);

      assert.that(uuid.is(id)).is.true();
    });

    test('throws an error if the user is not authorized to add blobs.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { });

      await assert.that(async () => {
        await page.evaluate(selectFileAndAddBlob);
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });

  suite('getBlob', () => {
    test('returns the blob.', async () => {
      const originalFile = await chooseFileToUpload({ page });
      const originalImage = Array.from(new Uint8Array(await readFile(originalFile.dataPath)));

      await page.evaluate(createClient, { token });
      const id = await page.evaluate(selectFileAndAddBlob);
      const result = await page.evaluate(getBlobAndTransformIntoArray, { id });

      assert.that(result.stream).is.equalTo(originalImage);
      assert.that(result.fileName).is.equalTo(originalFile.fileName);
      assert.that(result.contentType).is.equalTo('application/octet-stream');
    });

    test('returns the blob with the specified content type.', async () => {
      const originalFile = await chooseFileToUpload({ page });

      await page.evaluate(createClient, { token });
      const id = await page.evaluate(selectFileAndAddBlob, { contentType: originalFile.contentType });
      const result = await page.evaluate(getBlobAndTransformIntoArray, { id });

      assert.that(result.contentType).is.equalTo(originalFile.contentType);
    });

    test('throws an error if the specified blob does not exist.', async () => {
      const id = uuid();

      await page.evaluate(createClient, { token });

      await assert.that(async () => {
        await page.evaluate(getBlobAndTransformIntoArray, { id });
      }).is.throwingAsync(ex => ex.message.includes('Blob not found.'));
    });

    test('throws an error if the user is not authorized to get a blob.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddBlob);

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.otherClient = new window.DepotClient({
            host: 'localhost',
            port: 3000
          });

          return await window.otherClient.getBlob({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });

  suite('removeBlob', () => {
    test('removes the blob.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddBlob);

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.removeBlob({ id: options.id });
        }, { id });
      }).is.not.throwingAsync();

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.removeBlob({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('Blob not found.'));
    });

    test('throws an error if the specified blob does not exist.', async () => {
      const id = uuid();

      await page.evaluate(createClient, { token });

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.removeBlob({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('Blob not found.'));
    });

    test('throws an error if the user is not authorized to remove a blob.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddBlob);

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.otherClient = new window.DepotClient({
            host: 'localhost',
            port: 3000
          });

          await window.otherClient.removeBlob({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });

  suite('transferOwnership', () => {
    test('transfers the ownership.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddBlob);

      await page.evaluate(async options => {
        await window.client.transferOwnership({ id: options.id, to: options.newOwnerId });
      }, { id, newOwnerId: uuid() });

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.getBlob({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });

    test('throws an error if the specified blob does not exist.', async () => {
      const id = uuid();

      await page.evaluate(createClient, { token });

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.transferOwnership({ id: options.id, to: options.newOwnerId });
        }, { id, newOwnerId: uuid() });
      }).is.throwingAsync(ex => ex.message.includes('Blob not found.'));
    });

    test('throws an error if the user is not authorized to transfer the ownership.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddBlob);

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.otherClient = new window.DepotClient({
            host: 'localhost',
            port: 3000
          });

          await window.otherClient.transferOwnership({ id: options.id, to: options.newOwnerId });
        }, { id, newOwnerId: uuid() });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });

  suite('authorize', () => {
    test('authorizes the blob.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddBlob);

      const isAuthorized = {
        queries: {
          getBlob: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.authorize({ id: options.id, isAuthorized: options.isAuthorized });
        }, { id, isAuthorized });
      }).is.not.throwingAsync();

      let size;

      await assert.that(async () => {
        size = await page.evaluate(async options => {
          window.publicClient = new window.DepotClient({
            host: 'localhost',
            port: 3000
          });

          const blobInBrowser = await window.publicClient.getBlob({ id: options.id });

          return blobInBrowser.stream.size;
        }, { id });
      }).is.not.throwingAsync();

      assert.that(size).is.equalTo(26909);
    });

    test('throws an error if the specified blob does not exist.', async () => {
      await page.evaluate(createClient, { token });

      const id = uuid();
      const isAuthorized = {
        queries: {
          getBlob: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.authorize({ id: options.id, isAuthorized: options.isAuthorized });
        }, { id, isAuthorized });
      }).is.throwingAsync(ex => ex.message.includes('Blob not found.'));
    });

    test('throws an error if the user is not authorized to authorize.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddBlob);

      const isAuthorized = {
        queries: {
          getBlob: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.otherClient = new window.DepotClient({
            host: 'localhost',
            port: 3000
          });

          const blobInBrowser = await window.otherClient.authorize({ id: options.id, isAuthorized: options.isAuthorized });

          return blobInBrowser.stream.size;
        }, { id, isAuthorized });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });
});

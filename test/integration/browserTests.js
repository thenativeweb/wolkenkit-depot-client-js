'use strict';

/* globals window */

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
    protocol: 'http',
    host: 'localhost',
    port: 3000,
    token: options.token
  });
};

const selectFileAndAddFile = async function (options = {}) {
  const fileInput = window.document.getElementById('file-input');

  const file = fileInput.files[0];

  if (!file) {
    throw new Error('Input not working.');
  }

  return await window.client.addFile({
    content: file,
    fileName: 'wolkenkit.png',
    contentType: options.contentType
  });
};

const getFileAndTransformIntoArray = async function (options = {}) {
  const { content, fileName, contentType } = await window.client.getFile({ id: options.id });

  const result = await new Promise((resolve, reject) => {
    const reader = new window.FileReader();

    try {
      reader.addEventListener('loadend', () => {
        resolve({
          content: Array.from(new Uint8Array(reader.result)),
          fileName,
          contentType
        });
      });

      reader.readAsArrayBuffer(content);
    } catch (ex) {
      reject(ex);
    }
  });

  return result;
};

const getFileAndTransformIntoDataUrl = async function (options = {}) {
  const file = await window.client.getFile({ id: options.id });

  const dataUrl = await file.asDataUrl();

  return dataUrl;
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

    browser = await puppeteer.launch();
    page = await browser.newPage();

    await page.goto('http://localhost:4000/');
  });

  teardown(async () => {
    await browser.close();
  });

  suite('addFile', () => {
    test('returns the id.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });
      const id = await page.evaluate(selectFileAndAddFile);

      assert.that(uuid.is(id)).is.true();
    });

    test('throws an error if the user is not authorized to add files.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { });

      await assert.that(async () => {
        await page.evaluate(selectFileAndAddFile);
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });

  suite('getFile', () => {
    test('returns the file.', async () => {
      const originalFile = await chooseFileToUpload({ page });
      const originalImage = Array.from(new Uint8Array(await readFile(originalFile.dataPath)));

      await page.evaluate(createClient, { token });
      const id = await page.evaluate(selectFileAndAddFile);
      const result = await page.evaluate(getFileAndTransformIntoArray, { id });

      assert.that(result.content).is.equalTo(originalImage);
      assert.that(result.fileName).is.equalTo(originalFile.fileName);
      assert.that(result.contentType).is.equalTo('application/octet-stream');
    });

    test('returns the file with the specified content type.', async () => {
      const originalFile = await chooseFileToUpload({ page });

      await page.evaluate(createClient, { token });
      const id = await page.evaluate(selectFileAndAddFile, { contentType: originalFile.contentType });
      const result = await page.evaluate(getFileAndTransformIntoArray, { id });

      assert.that(result.contentType).is.equalTo(originalFile.contentType);
    });

    test('throws an error if the specified file does not exist.', async () => {
      const id = uuid();

      await page.evaluate(createClient, { token });

      await assert.that(async () => {
        await page.evaluate(getFileAndTransformIntoArray, { id });
      }).is.throwingAsync(ex => ex.message.includes('File not found.'));
    });

    test('throws an error if the user is not authorized to get a file.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddFile);

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.otherClient = new window.DepotClient({
            protocol: 'http',
            host: 'localhost',
            port: 3000
          });

          return await window.otherClient.getFile({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });

    suite('asDataUrl', () => {
      test('returns the data url.', async () => {
        const originalFile = await chooseFileToUpload({ page });

        await page.evaluate(createClient, { token });
        const id = await page.evaluate(selectFileAndAddFile, { contentType: originalFile.contentType });
        const result = await page.evaluate(getFileAndTransformIntoDataUrl, { id });

        await page.evaluate(async options => {
          const image = new window.Image();

          image.id = 'result-image';
          image.src = options.result;

          window.document.body.appendChild(image);
        }, { result });

        const dimensions = await page.$eval('#result-image', el => ({ width: el.clientWidth, height: el.clientHeight }));

        assert.that(dimensions).is.equalTo({
          width: 382,
          height: 452
        });
      });
    });
  });

  suite('removeFile', () => {
    test('removes the file.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddFile);

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.removeFile({ id: options.id });
        }, { id });
      }).is.not.throwingAsync();

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.removeFile({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('File not found.'));
    });

    test('throws an error if the specified file does not exist.', async () => {
      const id = uuid();

      await page.evaluate(createClient, { token });

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.removeFile({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('File not found.'));
    });

    test('throws an error if the user is not authorized to remove a file.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddFile);

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.otherClient = new window.DepotClient({
            protocol: 'http',
            host: 'localhost',
            port: 3000
          });

          await window.otherClient.removeFile({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });

  suite('transferOwnership', () => {
    test('transfers the ownership.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddFile);

      await page.evaluate(async options => {
        await window.client.transferOwnership({ id: options.id, to: options.newOwnerId });
      }, { id, newOwnerId: uuid() });

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.getFile({ id: options.id });
        }, { id });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });

    test('throws an error if the specified file does not exist.', async () => {
      const id = uuid();

      await page.evaluate(createClient, { token });

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.transferOwnership({ id: options.id, to: options.newOwnerId });
        }, { id, newOwnerId: uuid() });
      }).is.throwingAsync(ex => ex.message.includes('File not found.'));
    });

    test('throws an error if the user is not authorized to transfer the ownership.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddFile);

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.otherClient = new window.DepotClient({
            protocol: 'http',
            host: 'localhost',
            port: 3000
          });

          await window.otherClient.transferOwnership({ id: options.id, to: options.newOwnerId });
        }, { id, newOwnerId: uuid() });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });

  suite('authorize', () => {
    test('authorizes the file.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddFile);

      const isAuthorized = {
        queries: {
          getFile: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.authorize({ id: options.id, isAuthorized: options.isAuthorized });
        }, { id, isAuthorized });
      }).is.not.throwingAsync();

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.publicClient = new window.DepotClient({
            protocol: 'http',
            host: 'localhost',
            port: 3000
          });

          await window.publicClient.getFile({ id: options.id });
        }, { id });
      }).is.not.throwingAsync();
    });

    test('throws an error if the specified file does not exist.', async () => {
      await page.evaluate(createClient, { token });

      const id = uuid();
      const isAuthorized = {
        queries: {
          getFile: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await page.evaluate(async options => {
          await window.client.authorize({ id: options.id, isAuthorized: options.isAuthorized });
        }, { id, isAuthorized });
      }).is.throwingAsync(ex => ex.message.includes('File not found.'));
    });

    test('throws an error if the user is not authorized to authorize.', async () => {
      await chooseFileToUpload({ page });
      await page.evaluate(createClient, { token });

      const id = await page.evaluate(selectFileAndAddFile);

      const isAuthorized = {
        queries: {
          getFile: { forPublic: true }
        }
      };

      await assert.that(async () => {
        await page.evaluate(async options => {
          window.otherClient = new window.DepotClient({
            protocol: 'http',
            host: 'localhost',
            port: 3000
          });

          const fileInBrowser = await window.otherClient.authorize({ id: options.id, isAuthorized: options.isAuthorized });

          return fileInBrowser.stream.size;
        }, { id, isAuthorized });
      }).is.throwingAsync(ex => ex.message.includes('Authentication required.'));
    });
  });
});

'use strict';

const base64 = require('base64-js'),
      isNode = require('is-node');

/* globals window */

const convertContentToDataUrl = async function ({ content, contentType }) {
  if (!content) {
    throw new Error('Content is missing.');
  }
  if (!contentType) {
    throw new Error('Content type is missing.');
  }

  if (isNode) {
    const contentAsArray = [];

    const dataUrl = await new Promise((resolve, reject) => {
      let unsubscribe;

      const onData = function (data) {
        contentAsArray.push(...data.values());
      };

      const onEnd = function () {
        unsubscribe();

        const contentAsBase64 = base64.fromByteArray(contentAsArray);
        const result = `data:${contentType};base64,${contentAsBase64}`;

        resolve(result);
      };

      const onError = function (err) {
        unsubscribe();
        reject(err);
      };

      unsubscribe = function () {
        content.removeListener('data', onData);
        content.removeListener('end', onEnd);
        content.removeListener('error', onError);
      };

      content.on('data', onData);
      content.on('end', onEnd);
      content.on('error', onError);
    });

    return dataUrl;
  }

  const reader = new window.FileReader();

  await new Promise((resolve, reject) => {
    let unsubscribe;

    const onLoadEnd = function () {
      unsubscribe();
      resolve();
    };

    unsubscribe = function () {
      reader.removeEventListener('loadend', onLoadEnd);
    };

    reader.addEventListener('loadend', onLoadEnd);

    try {
      reader.readAsDataURL(content);
    } catch (ex) {
      unsubscribe();
      reject(ex);
    }
  });

  return reader.result;
};

module.exports = convertContentToDataUrl;

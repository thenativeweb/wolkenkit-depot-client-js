'use strict';

const EventEmitter2 = require('eventemitter2'),
      isNode = require('is-node'),
      request = require('axios'),
      uuid = require('uuidv4');

const convertContentToDataUrl = require('./convertContentToDataUrl');

const validProtocols = [ 'http', 'https' ];

class DepotClient extends EventEmitter2 {
  constructor ({ protocol = 'https', host, port = 443, token = '' }) {
    if (!validProtocols.includes(protocol)) {
      throw new Error('Invalid protocol.');
    }
    if (!host) {
      throw new Error('Host is missing.');
    }

    super({ wildcard: true, delimiter: '::' });

    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.token = token;
  }

  processProgress ({ id, type, startTime, progressEvent }) {
    if (!id) {
      throw new Error('Id is missing.');
    }
    if (!type) {
      throw new Error('Type is missing.');
    }
    if (!startTime) {
      throw new Error('Start time is missing.');
    }
    if (!progressEvent) {
      throw new Error('Progress event is missing.');
    }

    const elapsedTime = Date.now() - startTime;

    if (!progressEvent.lengthComputable) {
      return this.emit(`progress::${id}`, { type, elapsedTime });
    }

    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);

    if (progress === 0) {
      return this.emit(`progress::${id}`, { type, progress, elapsedTime });
    }

    const remainingProgress = 100 - progress;
    const estimatedRemainingTime = Math.round(elapsedTime / progress * remainingProgress);

    this.emit(`progress::${id}`, { type, progress, elapsedTime, estimatedRemainingTime });
  }

  async addFile ({
    id = uuid(),
    content,
    fileName,
    contentType,
    isAuthorized,
    onProgress = () => {
      // Intentionally left blank.
    }
  }) {
    if (!content) {
      throw new Error('Content is missing.');
    }
    if (!fileName) {
      throw new Error('File name is missing.');
    }

    const { protocol, host, port, token } = this;
    const metadata = { id, fileName };

    if (contentType) {
      metadata.contentType = contentType;
    }
    if (isAuthorized) {
      metadata.isAuthorized = isAuthorized;
    }

    const headers = { 'x-metadata': JSON.stringify(metadata) };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const startTime = Date.now();

    this.on(`progress::${id}`, onProgress);

    try {
      await request({
        method: 'post',
        url: `${protocol}://${host}:${port}/api/v1/add-file`,
        data: content,
        headers,
        onUploadProgress: progressEvent => {
          this.processProgress({ id, type: 'upload', startTime, progressEvent });
        }
      });

      return id;
    } catch (ex) {
      if (!ex.response) {
        throw ex;
      }

      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        default:
          throw ex;
      }
    } finally {
      this.removeAllListeners(`progress::${id}`);
    }
  }

  async getFile ({
    id,
    onProgress = () => {
      // Intentionally left blank.
    }
  }) {
    if (!id) {
      throw new Error('Id is missing.');
    }

    const { protocol, host, port, token } = this;

    const headers = {};

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const startTime = Date.now();
    let response;

    this.on(`progress::${id}`, onProgress);

    try {
      response = await request({
        method: 'get',
        url: `${protocol}://${host}:${port}/api/v1/file/${id}`,
        headers,
        responseType: isNode ? 'stream' : 'blob',
        onDownloadProgress: progressEvent => {
          this.processProgress({ id, type: 'download', startTime, progressEvent });
        }
      });
    } catch (ex) {
      if (!ex.response) {
        throw ex;
      }

      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        case 404:
          throw new Error('File not found.');
        default:
          throw ex;
      }
    } finally {
      this.removeAllListeners(`progress::${id}`);
    }

    const { fileName, contentType } = JSON.parse(response.headers['x-metadata']);
    const content = response.data;

    return {
      content,
      fileName,
      contentType,
      async asDataUrl () {
        return await convertContentToDataUrl({ content, contentType });
      }
    };
  }

  async removeFile ({ id }) {
    if (!id) {
      throw new Error('Id is missing.');
    }

    const { protocol, host, port, token } = this;

    const metadata = { id };
    const headers = { 'x-metadata': JSON.stringify(metadata) };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    try {
      await request({
        method: 'post',
        url: `${protocol}://${host}:${port}/api/v1/remove-file`,
        headers
      });
    } catch (ex) {
      if (!ex.response) {
        throw ex;
      }

      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        case 404:
          throw new Error('File not found.');
        default:
          throw ex;
      }
    }
  }

  async transferOwnership ({ id, to }) {
    if (!id) {
      throw new Error('Id is missing.');
    }
    if (!to) {
      throw new Error('To is missing.');
    }

    const { protocol, host, port, token } = this;

    const metadata = { id };
    const headers = {
      'x-metadata': JSON.stringify(metadata),
      'x-to': to
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    try {
      await request({
        method: 'post',
        url: `${protocol}://${host}:${port}/api/v1/transfer-ownership`,
        headers
      });
    } catch (ex) {
      if (!ex.response) {
        throw ex;
      }

      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        case 404:
          throw new Error('File not found.');
        default:
          throw ex;
      }
    }
  }

  async authorize ({ id, isAuthorized }) {
    if (!id) {
      throw new Error('Id is missing.');
    }
    if (!isAuthorized) {
      throw new Error('Is authorized is missing.');
    }

    const { protocol, host, port, token } = this;

    const metadata = { id, isAuthorized };
    const headers = { 'x-metadata': JSON.stringify(metadata) };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    try {
      await request({
        method: 'post',
        url: `${protocol}://${host}:${port}/api/v1/authorize`,
        headers
      });
    } catch (ex) {
      if (!ex.response) {
        throw ex;
      }

      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        case 404:
          throw new Error('File not found.');
        default:
          throw ex;
      }
    }
  }
}

module.exports = DepotClient;

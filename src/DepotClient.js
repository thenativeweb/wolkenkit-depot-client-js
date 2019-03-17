'use strict';

const isNode = require('is-node'),
      request = require('axios'),
      uuid = require('uuidv4');

const convertContentToDataUrl = require('./convertContentToDataUrl');

const validProtocols = [ 'http', 'https' ];

class DepotClient {
  constructor ({ protocol = 'https', host, port = 443, token = '' }) {
    if (!validProtocols.includes(protocol)) {
      throw new Error('Invalid protocol.');
    }
    if (!host) {
      throw new Error('Host is missing.');
    }

    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.token = token;
  }

  async addFile ({ id = uuid(), content, fileName, contentType, isAuthorized }) {
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

    try {
      await request({
        method: 'post',
        url: `${protocol}://${host}:${port}/api/v1/add-file`,
        data: content,
        headers
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
    }
  }

  async getFile ({ id }) {
    if (!id) {
      throw new Error('Id is missing.');
    }

    const { protocol, host, port, token } = this;

    const headers = {};

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    let response;

    try {
      response = await request({
        method: 'get',
        url: `${protocol}://${host}:${port}/api/v1/file/${id}`,
        headers,
        responseType: isNode ? 'stream' : 'blob'
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

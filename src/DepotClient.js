'use strict';

const isNode = require('is-node'),
      request = require('axios');

class DepotClient {
  constructor ({ host, port = 443, token = '' }) {
    if (!host) {
      throw new Error('Host is missing.');
    }

    this.host = host;
    this.port = port;
    this.token = token;
  }

  async addBlob ({ content, fileName, contentType, isAuthorized }) {
    if (!content) {
      throw new Error('Content is missing.');
    }
    if (!fileName) {
      throw new Error('File name is missing.');
    }

    const { host, port, token } = this;

    const metadata = { fileName };

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

    let response;

    try {
      response = await request({
        method: 'post',
        url: `https://${host}:${port}/api/v1/add-blob`,
        data: content,
        headers
      });
    } catch (ex) {
      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        default:
          throw ex;
      }
    }

    const { id } = response.data;

    return id;
  }

  async getBlob ({ id }) {
    if (!id) {
      throw new Error('Id is missing.');
    }

    const { host, port, token } = this;

    const headers = {};

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    let response;

    try {
      response = await request({
        method: 'get',
        url: `https://${host}:${port}/api/v1/blob/${id}`,
        headers,
        responseType: isNode ? 'stream' : 'blob'
      });
    } catch (ex) {
      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        case 404:
          throw new Error('Blob not found.');
        default:
          throw ex;
      }
    }

    const { fileName, contentType } = JSON.parse(response.headers['x-metadata']);
    const content = response.data;

    return {
      content,
      fileName,
      contentType
    };
  }

  async removeBlob ({ id }) {
    if (!id) {
      throw new Error('Id is missing.');
    }

    const { host, port, token } = this;

    const metadata = { id };
    const headers = { 'x-metadata': JSON.stringify(metadata) };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    try {
      await request({
        method: 'post',
        url: `https://${host}:${port}/api/v1/remove-blob`,
        headers
      });
    } catch (ex) {
      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        case 404:
          throw new Error('Blob not found.');
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

    const { host, port, token } = this;

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
        url: `https://${host}:${port}/api/v1/transfer-ownership`,
        headers
      });
    } catch (ex) {
      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        case 404:
          throw new Error('Blob not found.');
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

    const { host, port, token } = this;

    const metadata = { id, isAuthorized };
    const headers = { 'x-metadata': JSON.stringify(metadata) };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    try {
      await request({
        method: 'post',
        url: `https://${host}:${port}/api/v1/authorize`,
        headers
      });
    } catch (ex) {
      switch (ex.response.status) {
        case 401:
          throw new Error('Authentication required.');
        case 404:
          throw new Error('Blob not found.');
        default:
          throw ex;
      }
    }
  }
}

module.exports = DepotClient;

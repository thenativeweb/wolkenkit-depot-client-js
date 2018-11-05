# wolkenkit-depot-client

wolkenkit-depot-client is a client to access the wolkenkit-depot blob storage.

## Installation

```shell
$ npm install wolkenkit-depot-client
```

## Quick start

First you need to add a reference to wolkenkit-depot-client in your application:

```javascript
const DepotClient = require('wolkenkit-depot-client');
```

Then you can instantiate a new client that lets you store and read files. Specify the `host` and the `port` of your `wolkenkit-depot` server:

```javascript
const depotClient = new DepotClient({
  host: 'localhost',
  port: 3000
});
```

## Storing files

Files can be stored using the `addBlob` function which accepts the `content` of the file, a `fileName` and an optional `contentType`. `addBlob` returns a unique `id` that can be used to read this file from the server using `getBlob`.

### From Node.js

When calling `addBlob` from inside a Node.js application the `content` property must be a stream.

```javascript
const fs = require('fs'),
      path = require('path');

const id = await depotClient.addBlob({
  content: fs.createReadStream(path.join(__dirname, 'wolkenkit.png'))
  fileName: 'wolkenkit.png'
});
```

### From the browser

When calling `addBlob` from inside a browser application the `content` property must be a [`File`](https://developer.mozilla.org/de/docs/Web/API/File). You can use an input element to ask users for a files to upload.

```javascript
const fileInput = document.getElementById('file-input');

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];

  const id = await depotClient.addBlob({
    content: file,
    fileName: 'wolkenkit.png'
  });
});
```

### Specifiying a content type

Use the `contentType` property to set the mime type explicitly.

```javascript
await depotClient.addBlob({
  content: …,
  fileName: 'wolkenkit.png',
  contentType: 'image/png'
});
```

## Reading files

Files can be retreived using the `getBlob` function which requires the `id` of the blob as a property.

### From Node.js

When calling `getBlob` from inside a Node.js application the `content` property of the returned blob will be a stream.

```javascript
const { content, fileName, contentType } = await window.client.getBlob({ id: '…' });
```

### From the browser

### As data url

```javascript
const { content, fileName, contentType } = await window.client.getBlob({ id: '…' });

const dataUrl = content.asDataUrl();

const image = new Image();

image.src = dataUrl;

document.body.appendChild(image);
```

### Using the FileReader API

If you need more low level access or you would like to read the content into something like an `ArrayBuffer` use a `FileReader` to read the `content` property of the returned blob.

```javascript
const { content, fileName, contentType } = await window.client.getBlob({ id: '…' });

const reader = new FileReader();

reader.addEventListener('loadend', () => {
  // result will be an ArrayBuffer
  console.log(reader.result);
});

reader.readAsArrayBuffer(content);
```

## Authentication


## Documentation

See [Storing files](https://docs.wolkenkit.io/latest/reference/building-a-client/storing-files/) on how to use this module to store files as blobs from within a [wolkenkit](https://www.wolkenkit.io) application.

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```shell
$ npx roboter
```

## License

Copyright (c) 2018 the native web.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with this program. If not, see [GNU Licenses](http://www.gnu.org/licenses/).

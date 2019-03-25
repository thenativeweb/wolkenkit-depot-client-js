'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var base64 = require('base64-js'),
    isNode = require('is-node');
/* globals window */


var convertContentToDataUrl =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var content, contentType, contentAsArray, dataUrl, reader;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            content = _ref.content, contentType = _ref.contentType;

            if (content) {
              _context.next = 3;
              break;
            }

            throw new Error('Content is missing.');

          case 3:
            if (contentType) {
              _context.next = 5;
              break;
            }

            throw new Error('Content type is missing.');

          case 5:
            if (!isNode) {
              _context.next = 11;
              break;
            }

            contentAsArray = [];
            _context.next = 9;
            return new Promise(function (resolve, reject) {
              var unsubscribe;

              var onData = function onData(data) {
                contentAsArray.push.apply(contentAsArray, (0, _toConsumableArray2.default)(data.values()));
              };

              var onEnd = function onEnd() {
                unsubscribe();
                var contentAsBase64 = base64.fromByteArray(contentAsArray);
                var result = "data:".concat(contentType, ";base64,").concat(contentAsBase64);
                resolve(result);
              };

              var onError = function onError(err) {
                unsubscribe();
                reject(err);
              };

              unsubscribe = function unsubscribe() {
                content.removeListener('data', onData);
                content.removeListener('end', onEnd);
                content.removeListener('error', onError);
              };

              content.on('data', onData);
              content.on('end', onEnd);
              content.on('error', onError);
            });

          case 9:
            dataUrl = _context.sent;
            return _context.abrupt("return", dataUrl);

          case 11:
            reader = new window.FileReader();
            _context.next = 14;
            return new Promise(function (resolve, reject) {
              var unsubscribe;

              var onLoadEnd = function onLoadEnd() {
                unsubscribe();
                resolve();
              };

              unsubscribe = function unsubscribe() {
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

          case 14:
            return _context.abrupt("return", reader.result);

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function convertContentToDataUrl(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = convertContentToDataUrl;
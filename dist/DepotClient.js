'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var isNode = require('is-node'),
    request = require('axios');

var convertContentToDataUrl = require('./convertContentToDataUrl');

var validProtocols = ['http', 'https'];

var DepotClient =
/*#__PURE__*/
function () {
  function DepotClient(_ref) {
    var _ref$protocol = _ref.protocol,
        protocol = _ref$protocol === void 0 ? 'https' : _ref$protocol,
        host = _ref.host,
        _ref$port = _ref.port,
        port = _ref$port === void 0 ? 443 : _ref$port,
        _ref$token = _ref.token,
        token = _ref$token === void 0 ? '' : _ref$token;
    (0, _classCallCheck2.default)(this, DepotClient);

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

  (0, _createClass2.default)(DepotClient, [{
    key: "addFile",
    value: function () {
      var _addFile = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(_ref2) {
        var content, fileName, contentType, isAuthorized, protocol, host, port, token, metadata, headers, response, id;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                content = _ref2.content, fileName = _ref2.fileName, contentType = _ref2.contentType, isAuthorized = _ref2.isAuthorized;

                if (content) {
                  _context.next = 3;
                  break;
                }

                throw new Error('Content is missing.');

              case 3:
                if (fileName) {
                  _context.next = 5;
                  break;
                }

                throw new Error('File name is missing.');

              case 5:
                protocol = this.protocol, host = this.host, port = this.port, token = this.token;
                metadata = {
                  fileName: fileName
                };

                if (contentType) {
                  metadata.contentType = contentType;
                }

                if (isAuthorized) {
                  metadata.isAuthorized = isAuthorized;
                }

                headers = {
                  'x-metadata': JSON.stringify(metadata)
                };

                if (token) {
                  headers.authorization = "Bearer ".concat(token);
                }

                _context.prev = 11;
                _context.next = 14;
                return request({
                  method: 'post',
                  url: "".concat(protocol, "://").concat(host, ":").concat(port, "/api/v1/add-file"),
                  data: content,
                  headers: headers
                });

              case 14:
                response = _context.sent;
                _context.next = 26;
                break;

              case 17:
                _context.prev = 17;
                _context.t0 = _context["catch"](11);

                if (_context.t0.response) {
                  _context.next = 21;
                  break;
                }

                throw _context.t0;

              case 21:
                _context.t1 = _context.t0.response.status;
                _context.next = _context.t1 === 401 ? 24 : 25;
                break;

              case 24:
                throw new Error('Authentication required.');

              case 25:
                throw _context.t0;

              case 26:
                id = response.data.id;
                return _context.abrupt("return", id);

              case 28:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[11, 17]]);
      }));

      function addFile(_x) {
        return _addFile.apply(this, arguments);
      }

      return addFile;
    }()
  }, {
    key: "getFile",
    value: function () {
      var _getFile = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(_ref3) {
        var id, protocol, host, port, token, headers, response, _JSON$parse, fileName, contentType, content;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                id = _ref3.id;

                if (id) {
                  _context3.next = 3;
                  break;
                }

                throw new Error('Id is missing.');

              case 3:
                protocol = this.protocol, host = this.host, port = this.port, token = this.token;
                headers = {};

                if (token) {
                  headers.authorization = "Bearer ".concat(token);
                }

                _context3.prev = 6;
                _context3.next = 9;
                return request({
                  method: 'get',
                  url: "".concat(protocol, "://").concat(host, ":").concat(port, "/api/v1/file/").concat(id),
                  headers: headers,
                  responseType: isNode ? 'stream' : 'blob'
                });

              case 9:
                response = _context3.sent;
                _context3.next = 22;
                break;

              case 12:
                _context3.prev = 12;
                _context3.t0 = _context3["catch"](6);

                if (_context3.t0.response) {
                  _context3.next = 16;
                  break;
                }

                throw _context3.t0;

              case 16:
                _context3.t1 = _context3.t0.response.status;
                _context3.next = _context3.t1 === 401 ? 19 : _context3.t1 === 404 ? 20 : 21;
                break;

              case 19:
                throw new Error('Authentication required.');

              case 20:
                throw new Error('File not found.');

              case 21:
                throw _context3.t0;

              case 22:
                _JSON$parse = JSON.parse(response.headers['x-metadata']), fileName = _JSON$parse.fileName, contentType = _JSON$parse.contentType;
                content = response.data;
                return _context3.abrupt("return", {
                  content: content,
                  fileName: fileName,
                  contentType: contentType,
                  asDataUrl: function () {
                    var _asDataUrl = (0, _asyncToGenerator2.default)(
                    /*#__PURE__*/
                    _regenerator.default.mark(function _callee2() {
                      return _regenerator.default.wrap(function _callee2$(_context2) {
                        while (1) {
                          switch (_context2.prev = _context2.next) {
                            case 0:
                              _context2.next = 2;
                              return convertContentToDataUrl({
                                content: content,
                                contentType: contentType
                              });

                            case 2:
                              return _context2.abrupt("return", _context2.sent);

                            case 3:
                            case "end":
                              return _context2.stop();
                          }
                        }
                      }, _callee2, this);
                    }));

                    function asDataUrl() {
                      return _asDataUrl.apply(this, arguments);
                    }

                    return asDataUrl;
                  }()
                });

              case 25:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[6, 12]]);
      }));

      function getFile(_x2) {
        return _getFile.apply(this, arguments);
      }

      return getFile;
    }()
  }, {
    key: "removeFile",
    value: function () {
      var _removeFile = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(_ref4) {
        var id, protocol, host, port, token, metadata, headers;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                id = _ref4.id;

                if (id) {
                  _context4.next = 3;
                  break;
                }

                throw new Error('Id is missing.');

              case 3:
                protocol = this.protocol, host = this.host, port = this.port, token = this.token;
                metadata = {
                  id: id
                };
                headers = {
                  'x-metadata': JSON.stringify(metadata)
                };

                if (token) {
                  headers.authorization = "Bearer ".concat(token);
                }

                _context4.prev = 7;
                _context4.next = 10;
                return request({
                  method: 'post',
                  url: "".concat(protocol, "://").concat(host, ":").concat(port, "/api/v1/remove-file"),
                  headers: headers
                });

              case 10:
                _context4.next = 22;
                break;

              case 12:
                _context4.prev = 12;
                _context4.t0 = _context4["catch"](7);

                if (_context4.t0.response) {
                  _context4.next = 16;
                  break;
                }

                throw _context4.t0;

              case 16:
                _context4.t1 = _context4.t0.response.status;
                _context4.next = _context4.t1 === 401 ? 19 : _context4.t1 === 404 ? 20 : 21;
                break;

              case 19:
                throw new Error('Authentication required.');

              case 20:
                throw new Error('File not found.');

              case 21:
                throw _context4.t0;

              case 22:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[7, 12]]);
      }));

      function removeFile(_x3) {
        return _removeFile.apply(this, arguments);
      }

      return removeFile;
    }()
  }, {
    key: "transferOwnership",
    value: function () {
      var _transferOwnership = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(_ref5) {
        var id, to, protocol, host, port, token, metadata, headers;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                id = _ref5.id, to = _ref5.to;

                if (id) {
                  _context5.next = 3;
                  break;
                }

                throw new Error('Id is missing.');

              case 3:
                if (to) {
                  _context5.next = 5;
                  break;
                }

                throw new Error('To is missing.');

              case 5:
                protocol = this.protocol, host = this.host, port = this.port, token = this.token;
                metadata = {
                  id: id
                };
                headers = {
                  'x-metadata': JSON.stringify(metadata),
                  'x-to': to
                };

                if (token) {
                  headers.authorization = "Bearer ".concat(token);
                }

                _context5.prev = 9;
                _context5.next = 12;
                return request({
                  method: 'post',
                  url: "".concat(protocol, "://").concat(host, ":").concat(port, "/api/v1/transfer-ownership"),
                  headers: headers
                });

              case 12:
                _context5.next = 24;
                break;

              case 14:
                _context5.prev = 14;
                _context5.t0 = _context5["catch"](9);

                if (_context5.t0.response) {
                  _context5.next = 18;
                  break;
                }

                throw _context5.t0;

              case 18:
                _context5.t1 = _context5.t0.response.status;
                _context5.next = _context5.t1 === 401 ? 21 : _context5.t1 === 404 ? 22 : 23;
                break;

              case 21:
                throw new Error('Authentication required.');

              case 22:
                throw new Error('File not found.');

              case 23:
                throw _context5.t0;

              case 24:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[9, 14]]);
      }));

      function transferOwnership(_x4) {
        return _transferOwnership.apply(this, arguments);
      }

      return transferOwnership;
    }()
  }, {
    key: "authorize",
    value: function () {
      var _authorize = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee6(_ref6) {
        var id, isAuthorized, protocol, host, port, token, metadata, headers;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                id = _ref6.id, isAuthorized = _ref6.isAuthorized;

                if (id) {
                  _context6.next = 3;
                  break;
                }

                throw new Error('Id is missing.');

              case 3:
                if (isAuthorized) {
                  _context6.next = 5;
                  break;
                }

                throw new Error('Is authorized is missing.');

              case 5:
                protocol = this.protocol, host = this.host, port = this.port, token = this.token;
                metadata = {
                  id: id,
                  isAuthorized: isAuthorized
                };
                headers = {
                  'x-metadata': JSON.stringify(metadata)
                };

                if (token) {
                  headers.authorization = "Bearer ".concat(token);
                }

                _context6.prev = 9;
                _context6.next = 12;
                return request({
                  method: 'post',
                  url: "".concat(protocol, "://").concat(host, ":").concat(port, "/api/v1/authorize"),
                  headers: headers
                });

              case 12:
                _context6.next = 24;
                break;

              case 14:
                _context6.prev = 14;
                _context6.t0 = _context6["catch"](9);

                if (_context6.t0.response) {
                  _context6.next = 18;
                  break;
                }

                throw _context6.t0;

              case 18:
                _context6.t1 = _context6.t0.response.status;
                _context6.next = _context6.t1 === 401 ? 21 : _context6.t1 === 404 ? 22 : 23;
                break;

              case 21:
                throw new Error('Authentication required.');

              case 22:
                throw new Error('File not found.');

              case 23:
                throw _context6.t0;

              case 24:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this, [[9, 14]]);
      }));

      function authorize(_x5) {
        return _authorize.apply(this, arguments);
      }

      return authorize;
    }()
  }]);
  return DepotClient;
}();

module.exports = DepotClient;
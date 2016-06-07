'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _rest = require('rest');

var _rest2 = _interopRequireDefault(_rest);

var _mime = require('rest/interceptor/mime');

var _mime2 = _interopRequireDefault(_mime);

var _errorCode = require('rest/interceptor/errorCode');

var _errorCode2 = _interopRequireDefault(_errorCode);

var _defaultRequest = require('rest/interceptor/defaultRequest');

var _defaultRequest2 = _interopRequireDefault(_defaultRequest);

var _pathPrefix = require('rest/interceptor/pathPrefix');

var _pathPrefix2 = _interopRequireDefault(_pathPrefix);

var _qipp = require('./interceptor/qipp');

var _qipp2 = _interopRequireDefault(_qipp);

var _csrf = require('./interceptor/csrf');

var _csrf2 = _interopRequireDefault(_csrf);

var _error = require('./interceptor/error');

var _error2 = _interopRequireDefault(_error);

var _clientId = require('./interceptor/clientId');

var _clientId2 = _interopRequireDefault(_clientId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var auth = function auth(_ref) {
    var path = _ref.path;
    var clientId = _ref.clientId;

    return _rest2.default.wrap(_defaultRequest2.default, { mixin: { withCredentials: true } }).wrap(_clientId2.default, { clientId: clientId }).wrap(_csrf2.default, { path: path + 'csrf-token' }).wrap(_pathPrefix2.default, { prefix: path }).wrap(_mime2.default, { mime: 'application/json' }).wrap(_errorCode2.default, { code: 400 });
};

var api = function api(_ref2) {
    var path = _ref2.path;
    var auth = _ref2.auth;

    return _rest2.default.wrap(_defaultRequest2.default).wrap(_pathPrefix2.default, { prefix: path }).wrap(_mime2.default, { mime: 'application/json' }).wrap(_errorCode2.default, { code: 400 }).wrap(_qipp2.default, { auth: auth });
};

exports.default = {
    api: api,
    auth: auth
};


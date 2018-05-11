'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildFontsTags = buildFontsTags;

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function buildFontsTags(content) {
  var fonts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var toImport = [];

  (0, _forEach2.default)(fonts, function (url, name) {
    var regex = new RegExp('"[^"]*font-family:[^"]*' + name + '[^"]*"', 'gmi');

    if (content.match(regex)) {
      toImport.push(url);
    }
  });

  if (toImport.length > 0) {
    return '\n      <!--[if !mso]><!-->\n        ' + (0, _map2.default)(toImport, function (url) {
      return '<link href="' + url + '" rel="stylesheet" type="text/css">';
    }).join('\n') + '\n        <style type="text/css">\n          ' + (0, _map2.default)(toImport, function (url) {
      return '@import url(' + url + ');';
    }).join('\n') + '\n        </style>\n      <!--<![endif]-->\n\n    ';
  }

  return '';
}
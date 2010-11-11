'use strict'

exports.SEPARATOR = '/'
exports.VERSION = 'active'
exports.PREFIX = 'package'
exports.LIB = 'lib'
exports.EXTENSION = '.js'
exports.VERSION_MARK = '@'
exports.EOP = '?'

exports.INDEX_FILE = 'index.html'
exports.DESCRIPTOR_FILE = 'package.json'
exports.TELEPORT_CORE_FILE = 'teleport.js'
exports.TELEPORT_ENGINE_FILE = 'teleport-service.js'
exports.NPM_DIR = require('npm').dir

exports.ENGINES_DIR = 'engine'
exports.PACKAGES_DIR = 'packages'
exports.PACKAGES_URI_PATH = '/' + exports.PACKAGES_DIR + '/'
exports.TELEPORT_URI_PATH = exports.PACKAGES_URI_PATH + exports.TELEPORT_CORE_FILE
exports.ROOT_URI = '/'
exports.TELEPORT_JOIN_STR = '\n'

exports.COMMENTS_MATCH = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|((^|\n)[^\'\"\n]*\/\/[^\n]*)/g
exports.REQUIRE_MATCH = /(^|[^\w\_])require\s*\(('|")([\w\W]*?)('|")\)/g

exports.TRANSPORT_WRAPPER = 'define("{{id}}", [{{dependencies}}], function(require, exports, module, undefined) { {{source}} \n/**/});'
exports.MODULE_NOT_FOUND_ERROR = '\n  throw new Error("Required module `{{id}}` can\'t be found under the path: `{{path}}`")'
exports.PACKAGE_NOT_FOUND_ERROR = '\n throw new Error("Package `{{name}}` is not listed in the package dependcies. Please add it in to the `package.json` if you need to load it!")'

exports.STR_ACTIVE = 'Teleport is activated http://127.0.0.1:4747'

exports.ERR_NO_COMMAND = 'Not sure what do you mean by that!!'
exports.ERR_NOT_IN_PACKAGE = 'Teleport can be only activated form a package directory.'
exports.ERR_PACKAGE_NOT_FOUND = 'Package `{{main}}` has a dependency `{{name}}` that is neither installed nor linked by npm.'
      + '\nIf `{{name}}` is in npm registry you can install it by running: \n npm install {{name}}'
      + '\nIf `{{name}}` is a package that you work on, link it by running following command form the package directory: \n npm link {{name}}'


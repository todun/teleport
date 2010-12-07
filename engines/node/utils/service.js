'use strict'

var http = require('http')
,   mimeType = require('./mime').mimeType
,   fs =  require('promised-fs')
,   when = require('q').when
,   all = require('promised-utils').all
,   Registry = require('teleport/registry').Registry
,   Promised = require('promised-utils').Promised
,   Catalog = require('teleport/catalog').Catalog
,   activePackage = require('teleport/catalog/package').descriptor
,   CONST = require('teleport/strings')
,   parseURL = require('url').parse

,   server = http.createServer()
,   lib = fs.Path(module.filename).directory().directory()
,   core = lib.join(CONST.TELEPORT_CORE_FILE).read()
,   engine = lib.join(CONST.ENGINES_DIR, CONST.TELEPORT_ENGINE_FILE).read()
,   playground = lib.join(CONST.TELEPORT_PLAYGROUND).read()
,   root = fs.Path(CONST.NPM_DIR)
,   deprecatedPath = 'packages/teleport.js'
,   newTeleportPath = 'packages/teleport/teleport.js'

var registry = Registry();


function isUnderPackages(path) {
  var index = path.indexOf('packages/')
  return index >= 0 && index <= 1 && 10 < path.length
}

function redirectTo(url, response) {
  response.writeHead(302, { 'Location': url })
  response.end()
}

function makePackageRedirectURL(name, url) {
  var redirectURL = '/packages/' + name
  if (url !== '/packages' && url !== '/packages/') redirectURL += url
  return redirectURL
}

function isPathToFile(path) {
  return 0 <= String(path).substr(path.lastIndexOf('/') + 1).indexOf('.')
}
function compeletPath(path) {
  path = String(path)
  if (!isPathToFile(path)) {
    if ('/' !== path.charAt(path.length - 1)) path += '/'
    path += 'index.html'
  }
  return path
}
function normalizePath(path) {
  if (!isPathToFile(path) && '/' !== path.charAt(path.length - 1)) path += '/'
  return path
}

function getPackageName(path) {
  path = String(path).replace('/packages/', '')
  return path.substr(0, path.indexOf('/'))
}

function getPackageRelativePath(path, name) {
  var packageRoot = '/packages/'
  if (name) packageRoot += name
  return String(path).replace(packageRoot, '')
}

function isJSPath(path) {
  return '.js' === String(path).substr(-3)
}
function removeJSExtension(path) {
  return isJSPath(path) ? path.substr(0, path.length - 3) : path
}
function isModuleRequest(url) {
  return 0 <= String(url.search).indexOf('module') && isJSPath(url.pathname)
}

function getModuleId(path) {
  return removeJSExtension(getPackageRelativePath(path))
}
function getContentPath(path) {
  return String(path).substr(1)
}

function isTransportRequest(url) {
  return 0 <= String(url.search).indexOf('transport')
}

exports.activate = function activate() {
  return when
  ( activePackage()
  , function onFound(descriptor) {
      start(JSON.parse(descriptor).name)
    }
  , start.bind(null, 'teleport')
  )
}


function start(name) {
  server.listen(4747)
  console.log('Teleport is activated: http://localhost:4747/packages/' + name)
  server.on('request', function(request, response) {
    var url = parseURL(request.url)
      , needToWrap = isTransportRequest(url)
      , path = url.pathname
      , normalizedPath = normalizePath(path)
      , index = path.indexOf(CONST.PACKAGES_URI_PATH)
      , relativePath
      , packageName
      , mime
      , content
      , pack

    // If user has requested anything that is not under packages folder we
    // can't handle that so we should redirect to a packages/rest/of/path
    // instead.
    if (!isUnderPackages(path))
      redirectTo(makePackageRedirectURL(name, normalizedPath), response)
    if (normalizedPath !== path) redirectTo(normalizedPath, response)
    else {
      packageName = getPackageName(path)
      relativePath = getPackageRelativePath(compeletPath(path), packageName)
      mime = mimeType(String(relativePath))

      if (packageName && relativePath) {
        pack = registry.get('packages').get(packageName)
        if (isModuleRequest(url)) {
          var method = needToWrap ? 'getModuleTransport' : 'getModuleSource'
          content = pack.invoke(method, [getModuleId(relativePath)])
        // Module 'teleport' is deprecated, all the request to in in old format
        // are redirected to a new static file 'teleport/teleport.js'.
        } else if (relativePath.substr(1) == deprecatedPath) {
          redirectTo('/' + newTeleportPath, response)
          console.log('Usage of `' + deprecatedPath + '` is deprecated, please update your html to refer to `' + newTeleportPath + '` instead.')
        } else {
          content = pack.invoke('getContent', [getContentPath(relativePath)])
        }
        when
        ( content
        , function onDocument(content) {
            response.writeHead(200, { 'Content-Type': mime })
            response.end(content)
          }
        , function onFailed(error) {
            response.writeHead(404)
            Promised.sync(response.end).call(response, playground)
          }
        )
      } else {
        response.writeHead(404)
        Promised.sync(response.end)(playground)
      }
    }
  })
}

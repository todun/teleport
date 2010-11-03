'use strict'

var fs =  require('promised-fs')
,   when = require('q').when
,   Trait = require('light-traits').Trait
,   CONST = require('teleport/strings')

,   EXTENSION = CONST.EXTENSION
,   SEPARATOR = CONST.SEPARATOR
,   VERSION_MARK = CONST.VERSION_MARK
,   VERSION = CONST.VERSION
,   PREFIX = CONST.PREFIX
,   LIB = CONST.LIB
,   TRANSPORT_WRAPPER = CONST.TRANSPORT_WRAPPER
,   MODULE_NOT_FOUND_ERROR = CONST.MODULE_NOT_FOUND_ERROR
,   PACKAGE_NOT_FOUND_ERROR = CONST.PACKAGE_NOT_FOUND_ERROR

exports.Module = function Module(options) {
  return ModuleTrait.create(options)
}
var ModuleTrait = Trait(
{ packages: Trait.required
, packagesPath: Trait.required
, url: Trait.required
, get packageMeta() {
    return this.packages[this.packageName]
  }
  // Package name
, get packageName() {
    var name = this.url.split(SEPARATOR)[0].split(VERSION_MARK)[0]
    return name.substr(-3) == EXTENSION ? name.substr(0, name.length - 3) : name
  }
, get packagePath() {
    return this.packagesPath.join
      (this.packageName, this.version || VERSION, PREFIX)
  }
  // Whether or not this module is main.
, get isMain() {
    return 0 > this.url.indexOf(SEPARATOR)
  }
  // Package version
, get version() {
    var version = this.url.split(SEPARATOR)[0].split(VERSION_MARK)[1] || ''
    return version.substr(-3) == EXTENSION ?
      version.substr(0, version.length - 3) : version
  }
, get relativeId() {
    return this.id.substr(this.id.indexOf(SEPARATOR) + 1)
  }
, get id() {
    return this.url.substr(0, this.url.length - EXTENSION.length)
  }
, get path() {
    var packageMeta = this.packageMeta
    ,   path = null

    // If package is not in catalog then returning `null`
    if (!packageMeta) return path
    // If it's a main module reading path form descriptor.
    if (this.isMain) {
      path = this.packagePath.join(this.packageMeta.main)
    } else {
      var modules = packageMeta.modules
      if (modules && (path = modules[this.relativeId]))
        path = this.packagePath.join(path)
      else
        path = this.packagePath.join
        ( (packageMeta.directories || {}).lib || LIB
        , this.relativeId
        )
    }
    return String(path).substr(-3) == EXTENSION ? path :
      fs.Path(path + EXTENSION)
  }
, get source() {
    return !this.packageMeta ?
      PACKAGE_NOT_FOUND_ERROR.replace('{{name}}', this.packageName)
      : this.path.read()
  }
, get transport() {
    var id = this.id
    ,   path = String(this.path)
    return when
    ( this.source
    , function sourceResolved(content) {
        return TRANSPORT_WRAPPER.replace('{{id}}', id)
          .replace('{{source}}', content)
      }
    , function(reason) {
        var content = MODULE_NOT_FOUND_ERROR.replace('{{id}}', id)
          .replace('{{path}}', path)
        return TRANSPORT_WRAPPER.replace('{{id}}', id)
          .replace('{{source}}', content)
      }
    )
  }
})
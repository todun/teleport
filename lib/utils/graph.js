'use strict'

var fs = require('promised-fs')
,   npm = require('npm')
,   when = require('q').when
,   pu = require('promised-utils'), Promised = pu.Promised, all = pu.all

,   root = fs.Path(npm.dir)

,   DESCRIPTOR = 'package.json'
,   VERSION = 'active'
,   PREFIX = 'package'

var packages = root.list()

// Function takes package descriptor and parses it. It also applies overlay
// metadata. This is a promised function so it can take promises and will
// return promise of parsed json back.
var parse = Promised(function overlay(descriptor) {
  var meta = JSON.parse(descriptor)
  // If 'teleport' overlay is found return immediately.
  if (!('overlay' in meta) || !('teleport' in meta.overlay)) return meta
  var teleport = meta.overlay.teleport
  for (var key in teleport) meta[key] = teleport[key]
  return meta
})

// Function reads package descriptor and returns promise for the metadata.
function Meta(name) {
  return parse(root.join(name, VERSION, PREFIX, DESCRIPTOR).read())
}

// Returns package descriptors for all the dependencies
var dependencies = Promised(function dependencies(meta, packages, callback) {
  packages[meta.name] = meta
  // If there is no dependencies return immediately.
  if (!('dependencies' in meta)) return callback(null, packages)
  // Filtering out only dependencies that are not collected yet and
  // registering them.
  var metaDepends = Object.keys(meta.dependencies).filter(function(name) { 
   if (!(name in packages)) return packages[name] = true
  })
  // If package does not has any new dependencies return immediately.
  if (!metaDepends.length) return callback(null, packages)
  // Collecting metadata for all the newly discovered dependencies.
  var scanned = 0
  metaDepends.map(Meta).forEach(function(meta) { when(meta, function(meta) {
    // Scanning dependencies.
    dependencies(meta, packages, function tracker() {
      // If all the dependent packages are scanned for dependencies
      // calling a callback.
      if (metaDepends.length == ++scanned) callback(null, packages)
    })
  // Calling callback with an error if reading files failed.
  }, callback ) })
})

exports.graph = function graph(name) {
  // Reading `package.json` for the specified package name and parsing it.
  return dependencies(Meta(name), {})
}
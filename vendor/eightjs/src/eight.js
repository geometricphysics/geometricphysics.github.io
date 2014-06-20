define(function(require)
{
  var eight = require('eight/core');

  eight.object3D = require('eight/core/object3D');

  eight.geometry = require('eight/core/geometry');
  eight.material = require('eight/core/material');

  eight.camera = require('eight/cameras/camera');
  eight.perspectiveCamera = require('eight/cameras/perspectiveCamera');

  eight.webGLRenderer = require('eight/renderers/webGLRenderer');
  eight.scene = require('eight/scenes/scene');
  eight.mesh  = require('eight/objects/mesh');

  eight.webGLContextMonitor = require('eight/utils/webGLContextMonitor');
  eight.workbench3D = require('eight/utils/workbench3D');
  eight.windowAnimationRunner = require('eight/utils/windowAnimationRunner');

  eight.euclidean3 = require('eight/math/e3ga/euclidean3');
  eight.scalarE3   = require('eight/math/e3ga/scalarE3');
  eight.vectorE3   = require('eight/math/e3ga/vectorE3');
  eight.bivectorE3 = require('eight/math/e3ga/bivectorE3');

  eight.conformal3 = require('eight/math/c3ga/conformal3');
  eight.scalarC3   = require('eight/math/c3ga/scalarC3');
  eight.vectorC3   = require('eight/math/c3ga/vectorC3');

  eight.boxGeometry = require('eight/geometries/boxGeometry');
  eight.prismGeometry = require('eight/geometries/prismGeometry');

  eight.meshBasicMaterial = require('eight/materials/meshBasicMaterial');
  eight.meshNormalMaterial = require('eight/materials/meshNormalMaterial');

  return eight;
});

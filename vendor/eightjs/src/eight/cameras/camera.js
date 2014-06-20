define(['eight/core/object3D'], function(object3D)
{
  var constructor = function(spec, my)
  {
    var that;

    // Other private instance variables.

    my = my || {};

    // Add shared variables and functions to my.

    that = object3D(spec, my);

    that.projectionMatrix = mat4.create();

    // Add privileged methods to that.

    return that;
  };

  return constructor;
});
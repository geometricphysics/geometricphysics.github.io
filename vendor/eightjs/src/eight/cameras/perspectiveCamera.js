define(['eight/cameras/camera'], function(camera)
{
  var perspectiveCamera = function(fov, aspect, near, far)
  {
    fov = fov !== undefined ? fov : 50;
    aspect = aspect !== undefined ? aspect : 1;
    near = near !== undefined ? near : 0.1;
    far = far !== undefined ? far : 2000;

    var that = camera({});

    var updateProjectionMatrix = function()
    {
      mat4.perspective(that.projectionMatrix, fov, aspect, near, far);
    };

    Object.defineProperty(that, 'aspect', {
      get: function() {return aspect;},
      set: function(value) {aspect=value;}
    });

    that.updateProjectionMatrix = updateProjectionMatrix;

    that.updateProjectionMatrix();

    return that;
  };

  return perspectiveCamera;
});
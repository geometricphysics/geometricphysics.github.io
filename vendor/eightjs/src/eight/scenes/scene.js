define(['eight/core/object3D'], function(object3D)
{
  var constructor = function(spec, my)
  {
    var that;

    // Other private instance variables.
    var children = [];

    my = my || {};

    // Add shared variables and functions to my.

    that = object3D(spec, my);

    that.children = children;
    that.onContextGain = function(gl)
    {
      for(var i = 0, length = children.length; i < length; i++)
      {
        children[i].onContextGain(gl);
      }
    };
    that.onContextLoss = function()
    {
      for(var i = 0, length = children.length; i < length; i++)
      {
        children[i].onContextLoss();
      }
    };
    that.tearDown = function()
    {
      for(var i = 0, length = children.length; i < length; i++)
      {
        children[i].tearDown();
      }
    };
    that.add = function(child)
    {
      children.push(child);
    };

    // Add privileged methods to that.

    return that;
  };

  return constructor;
});
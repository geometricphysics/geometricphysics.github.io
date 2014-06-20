define(['eight/math/c3ga/conformal3'], function(conformal3)
{
  var geometry = function(spec, my)
  {
    var that;

    // Other private instance variables.

    my = my || {};

    // Add shared variables and functions to my.

    that =
    {
      vertices: [],
      vertexIndices: [],
      colors: [],
      primitiveMode: function(gl)
      {
        return gl.TRIANGLES;
      }
    };

    // Add privileged methods to that.

    return that;
  };

  return geometry;
});
define(['eight/math/c3ga/conformal3','eight/math/e3ga/euclidean3'], function(conformal3, euclidean3)
{
  var object3D = function(spec, my)
  {
    my = my || {};

    var that =
    {
      position: euclidean3(0,0,0,0,0,0,0,0),
      attitude: euclidean3(1,0,0,0,0,0,0,0),
      transform: conformal3(),
      onContextGain: function(gl)
      {
        console.error("Missing onContextGain function");
      },
      onContextLoss: function()
      {
        console.error("Missing onContextLoss function");
      },
      tearDown: function()
      {
        console.error("Missing tearDown function");
      },
      updateMatrix: function()
      {
        console.error("Missing updateMatrix function");
      },
      draw: function(projectionMatrix)
      {
        console.error("Missing draw function");
      }
    };

    return that;
  };

  return object3D;
});
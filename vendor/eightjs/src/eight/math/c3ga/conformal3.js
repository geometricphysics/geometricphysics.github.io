define(function()
{
  var conformal3 = function(spec, my)
  {
    var w = spec ? (typeof spec.w !== 'undefined' ? spec.w : 0) : 0;
    var x = spec ? (typeof spec.x !== 'undefined' ? spec.x : 0) : 0;
    var y = spec ? (typeof spec.y !== 'undefined' ? spec.y : 0) : 0;
    var z = spec ? (typeof spec.z !== 'undefined' ? spec.z : 0) : 0;

    var that =
    {
      norm: function()
      {
        return conformal3(Math.sqrt(x*x+y*y+z*z), 0, 0, 0, 0, 0, 0, 0);
      },
      quad: function()
      {
        return conformal3(x*x+y*y+z*z, 0, 0, 0, 0, 0, 0, 0);
      }
    };
    Object.defineProperty(that, 'w', {
      get: function() {return w;}
    });
    Object.defineProperty(that, 'x', {
      get: function() {return x;}
    });
    Object.defineProperty(that, 'y', {
      get: function() {return y;}
    });
    Object.defineProperty(that, 'z', {
      get: function() {return z;}
    });
    return that;
  };

  return conformal3;
});
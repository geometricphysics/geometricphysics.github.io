define(function()
{
  var euclidean3 = function(w, x, y, z, xy, yz, zx, xyz)
  {
    return new BLADE.Euclidean3(w, x, y, z, xy, yz, zx, xyz);
/*
    w = w || 0;
    x = x || 0;
    y = y || 0;
    z = z || 0;
    xy = xy || 0;
    yz = yz || 0;
    zx = zx || 0;
    xyz = xyz || 0;

    var that =
    {
      cross: function(mv)
      {
        return euclidean3(0, y*mv.z-z*mv.y, z*mv.x-x*mv.z, x*mv.y-y*mv.x, 0, 0, 0, 0);
      },
      div: function(mv)
      {
        return euclidean3(w/mv.w, x/mv.w, y/mv.w, z/mv.w, 0, 0, 0, 0);
      },
      mul: function(mv)
      {
        return euclidean3(w*mv.w, x*mv.w, y*mv.w, z*mv.w, xy*mv.w, yz*mv.w, zx*mv.w, xyz*mv.w);
      },
      norm: function()
      {
        return euclidean3(Math.sqrt(x*x+y*y+z*z), 0, 0, 0, 0, 0, 0, 0);
      },
      quad: function()
      {
        return euclidean3(x*x+y*y+z*z, 0, 0, 0, 0, 0, 0, 0);
      },
      sub: function(mv)
      {
        return euclidean3(w-mv.w, x-mv.x, y-mv.y, z-mv.z, xy-mv.xy, yz-mv.yz, zx-mv.zx, xyz-mv.xyz);
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
    Object.defineProperty(that, 'xy', {
      get: function() {return xy;}
    });
    Object.defineProperty(that, 'yz', {
      get: function() {return yz;}
    });
    Object.defineProperty(that, 'zx', {
      get: function() {return zx;}
    });
    Object.defineProperty(that, 'xyz', {
      get: function() {return xyz;}
    });
    return that;
*/
  };

  return euclidean3;
});
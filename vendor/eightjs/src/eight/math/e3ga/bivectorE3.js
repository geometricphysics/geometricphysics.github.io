define(['eight/math/e3ga/euclidean3'], function(euclidean3)
{
  return function(xy, yz, zx)
  {
    return euclidean3(0, 0, 0, 0, xy, yz, zx, 0);
  };
});
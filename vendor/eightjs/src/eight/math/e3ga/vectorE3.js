define(['eight/math/e3ga/euclidean3'], function(euclidean3)
{
  return function(x, y, z)
  {
    return euclidean3(0, x, y, z, 0, 0, 0, 0);
  };
});
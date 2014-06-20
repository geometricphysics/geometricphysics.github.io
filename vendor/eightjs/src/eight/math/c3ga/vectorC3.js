define(['eight/math/c3ga/conformal3'], function(conformal3)
{
  return function(xo, x1, x2, x3, xi)
  {
    var mv = conformal3();
    mv.xo = xo;
    mv.x1 = x1;
    mv.x2 = x2;
    mv.x3 = x3;
    mv.xi = xi;
    return mv;
  };
});
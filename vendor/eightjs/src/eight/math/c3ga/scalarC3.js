define(['eight/math/c3ga/conformal3'], function(conformal3)
{
  return function(w)
  {
    var mv = conformal3({'w': w});
    return mv;
  };
});
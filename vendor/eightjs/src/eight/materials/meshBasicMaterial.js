define(['eight/core/material'], function(material)
{
  var constructor = function(spec, my)
  {
    var api = material(spec, my);

    my = my || {};

    return api;
  };

  return constructor;
});
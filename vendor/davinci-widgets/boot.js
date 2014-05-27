 (function(window, head) {
  "use strict";

  head.js(

    { require    : "/vendor/requirejs/require.js",                  size: "82718"   },
    { underscore : "/vendor/underscore/underscore.js",              size: "45489"   },

    { angular    : "/vendor/angular/angular.js",                    size: "756488"  },
    { ngRoute    : "/vendor/angular-route/angular-route.js",        size: "33126"   },
    { ngSanitize : "/vendor/angular-sanitize/angular-sanitize.js",  size: "20772"   },

    { ace        : "/vendor/ace-builds/src-noconflict/ace.js",      size: "602707"  },

    { bladejs    : "/vendor/bladejs/dist/bladejs.min.js",           size: "27433"   },
    { easeljs    : "/vendor/EaselJS/lib/easeljs-0.7.1.min.js",      size: "54396"   },
    { threejs    : "/vendor/threejs/build/three.min.js",            size: "429774"  },
    { tweenjs    : "/vendor/TweenJS/lib/tweenjs-0.5.1.min.js",      size: "54396"   },
    { movieclip  : "/vendor/EaselJS/lib/movieclip-0.7.1.min.js",    size: "54396"   },
    { davinci    : "/vendor/davinci/davinci.min.js",                size: "708605"  },
    { davinciLib : "/vendor/davinci/davinci-stdlib.js",             size: "249733"  },

    { app        : "/vendor/davinci-widgets/main.js"                                }
  )
  .ready("ALL", function() {
    require(["main"], function(app) {
    });
  });
}(window, head));

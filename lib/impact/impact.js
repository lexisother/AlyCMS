// NOTE: THIS SCRIPT IS BASED OFF THE VERY GOOD WORK DONE BY DOMINIC A.K.A.
// PHOBOSLAB!!! I CANNOT MAKE THIS CLEAR ENOUGH!!!
// <https://github.com/phoboslab/Impact/blob/master/lib/impact/impact.js>

Number.prototype.limit = function (min, max) {
  return Math.min(max, Math.max(min, this));
};

Array.prototype.erase = function (item) {
  for (let i = this.length; i--; ) {
    if (this[i] === item) {
      this.splice(i, 1);
    }
  }
  return this;
};

/**
 * KeySpline - use bezier curve for transition easing function
 * is inspired from Firefox's nsSMILKeySpline.cpp
 * Usage:
 * var spline = new KeySpline(0.25, 0.1, 0.25, 1.0)
 * spline.get(x) => returns the easing value | x must be in [0, 1] range
 * Source: http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
 * @constructor
 */
window.KeySpline = function (mX1, mY1, mX2, mY2) {
  this.get = function (aX) {
    if (mX1 === mY1 && mX2 === mY2) return aX; // linear
    return CalcBezier(GetTForX(aX), mY1, mY2);
  };

  function A(aA1, aA2) {
    return 1.0 - 3.0 * aA2 + 3.0 * aA1;
  }
  function B(aA1, aA2) {
    return 3.0 * aA2 - 6.0 * aA1;
  }
  function C(aA1) {
    return 3.0 * aA1;
  }

  // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  function CalcBezier(aT, aA1, aA2) {
    return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
  }

  // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
  function GetSlope(aT, aA1, aA2) {
    return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
  }

  function GetTForX(aX) {
    // Newton raphson iteration
    let aGuessT = aX;
    for (let i = 0; i < 4; ++i) {
      let currentSlope = GetSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) return aGuessT;
      let currentX = CalcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }
};
window.KEY_SPLINES = {
  EASE_IN_OUT: new window.KeySpline(0.42, 0.0, 0.58, 1.0),
  EASE_OUT: new window.KeySpline(0.0, 0.0, 0.58, 1.0),
  EASE_IN: new window.KeySpline(0.42, 0.0, 1.0, 1.0),
  EASE: new window.KeySpline(0.25, 0.1, 0.25, 1.0),
  LINEAR: new window.KeySpline(0, 0, 1, 1),
  JUMPY: new window.KeySpline(0.31, 1.51, 0.53, 0.94),
  EASE_OUT_STRONG: new window.KeySpline(0.0, 0.5, 0.58, 1.0),
};

let addons = [];
window.ig = {
  root: window.IG_ROOT || 'lib/',
  paused: false,
  modules: {},
  resources: [],

  _current: null,
  _loadQueue: [],
  _waitForOnload: 0,

  copy: function (object) {
    if (
      !object ||
      typeof object != 'object' ||
      object instanceof HTMLElement ||
      object instanceof ig.Class
    ) {
      return object;
    } else if (object instanceof Array) {
      var c = [];
      for (var i = 0, l = object.length; i < l; i++) {
        c[i] = ig.copy(object[i]);
      }
      return c;
    } else {
      var c = {};
      for (var i in object) {
        c[i] = ig.copy(object[i]);
      }
      return c;
    }
  },

  module(name) {
    // Some required checks...
    if (ig._current) {
      throw new Error(`Module '${ig._current.name}' defines nothing`);
    }
    if (ig.modules[name] && ig.modules[name].body) {
      throw new Error(`Module '${name}' is already defined`);
    }

    // Initialize module skeleton and push to known modules
    ig._current = { name: name, requires: [], loaded: false, body: null };
    ig.modules[name] = ig._current;
    ig._loadQueue.push(ig._current);

    return ig;
  },
  requires() {
    // Yeah.
    ig._current.requires = Array.prototype.slice.call(arguments);
    return ig;
  },
  defines(body) {
    ig._current.body = body;
    ig._current = null;
    ig._initDOMReady();
  },

  _loadScript(name, requiredFrom) {
    ig.modules[name] = { name: name, requires: [], loaded: false, body: null };
    ig._waitForOnload++;

    let path = ig.root + name.replace(/\./g, '/') + '.js';
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = path;
    script.onload = () => {
      ig._execModules().then(() => {
        ig._waitForOnload--;
      });
    };
    script.onerror = () => {
      throw new Error(`Failed to load module ${name} at ${path} required from ${requiredFrom}`);
    };
    document.getElementsByTagName('head')[0].appendChild(script);
  },

  async _execModules() {
    let modulesLoaded = false;
    // Here be dependency resolution and execution thereof.
    for (let module of ig._loadQueue) {
      let dependenciesLoaded = true;

      for (let dep of module.requires) {
        if (!ig.modules[dep]) {
          dependenciesLoaded = false;
          ig._loadScript(dep, module.name);
        } else if (!ig.modules[dep].loaded) {
          dependenciesLoaded = false;
        }
      }

      if (dependenciesLoaded && module.body) {
        ig._loadQueue.splice(ig._loadQueue.indexOf(module), 1);
        await module.body();
        module.loaded = true;
        modulesLoaded = true;
      }
    }
    if (modulesLoaded) {
      await ig._execModules();
    }

    // No modules executed, no more files to load but loadQueue not empty?
    // Must be some unresolved dependencies!
    else if (!ig.baked && ig._waitForOnload == 0 && ig._loadQueue.length != 0) {
      let unresolved = [];
      for (let module of ig._loadQueue) {
        // Which dependencies aren't loaded?
        let unloaded = [];
        for (let dep of module.requires) {
          if (!dep || !dep.loaded) {
            unloaded.push(dep);
          }
        }
        unresolved.push(module.name + ' (requires: ' + unloaded.join(', ') + ')');
      }

      throw new Error(
        'Unresolved (or circular?) dependencies. ' +
          "Most likely there's a name/path mismatch for one of the listed modules " +
          'or a previous syntax error prevents a module from loading:\n' +
          unresolved.join('\n'),
      );
    }
  },

  _DOMReady() {
    if (!ig.modules['dom.ready'].loaded) {
      if (!document.body) {
        return setTimeout(ig._DOMReady, 13);
      }
      ig.modules['dom.ready'].loaded = true;
      ig._waitForOnload--;
      ig._execModules();
    }
    return 0;
  },

  _initDOMReady: function () {
    if (ig.modules['dom.ready']) {
      ig._execModules();
      return;
    }

    // Construct a fake dom.ready component for the framework to depend on, without it nothing would happen.
    ig.modules['dom.ready'] = { requires: [], loaded: false, body: null };
    ig._waitForOnload++;
    if (document.readyState === 'complete') {
      ig._DOMReady();
    } else {
      document.addEventListener('DOMContentLoaded', ig._DOMReady, false);
      window.addEventListener('load', ig._DOMReady, false);
    }
  },

  addResource(res) {
    this.resources.push(res);
  },

  addAddon(cb) {
    addons.push(cb);
  },
  initGameAddons() {
    let _addons = [];
    for (let addon of addons) {
      _addons.push(addon());
    }
    return _addons;
  },
};

// -----------------------------------------------------------------------------
// Class object based on John Resigs code; inspired by base2 and Prototype
// http://ejohn.org/blog/simple-javascript-inheritance/

var initializing = false,
  fnTest = /xyz/.test(function () {
    xyz;
  })
    ? /\bparent\b/
    : /.*/;
var lastClassId = 0;

window.ig.Class = function () {};
var inject = function (prop) {
  var proto = this.prototype;
  var parent = {};
  for (var name in prop) {
    if (
      typeof prop[name] == 'function' &&
      typeof proto[name] == 'function' &&
      fnTest.test(prop[name])
    ) {
      parent[name] = proto[name]; // save original function
      proto[name] = (function (name, fn) {
        return function () {
          var tmp = this.parent;
          this.parent = parent[name];
          var ret = fn.apply(this, arguments);
          this.parent = tmp;
          return ret;
        };
      })(name, prop[name]);
    } else {
      proto[name] = prop[name];
    }
  }
};

window.ig.Class.extend = function (prop) {
  var parent = this.prototype;

  initializing = true;
  var prototype = new this();
  initializing = false;

  for (var name in prop) {
    if (
      typeof prop[name] == 'function' &&
      typeof parent[name] == 'function' &&
      fnTest.test(prop[name])
    ) {
      prototype[name] = (function (name, fn) {
        return function () {
          var tmp = this.parent;
          this.parent = parent[name];
          var ret = fn.apply(this, arguments);
          this.parent = tmp;
          return ret;
        };
      })(name, prop[name]);
    } else {
      prototype[name] = prop[name];
    }
  }

  function Class() {
    if (!initializing) {
      // If this class has a staticInstantiate method, invoke it
      // and check if we got something back. If not, the normal
      // constructor (init) is called.
      if (this.staticInstantiate) {
        var obj = this.staticInstantiate.apply(this, arguments);
        if (obj) {
          return obj;
        }
      }
      for (var p in this) {
        if (typeof this[p] == 'object') {
          this[p] = ig.copy(this[p]); // deep copy!
        }
      }
      if (this.init) {
        this.init.apply(this, arguments);
      }
    }
    return this;
  }

  Class.prototype = prototype;
  Class.prototype.constructor = Class;
  Class.extend = window.ig.Class.extend;
  Class.inject = inject;
  Class.classId = prototype.classId = ++lastClassId;

  return Class;
};

ig.SiteAddon = ig.Class.extend({
  preUpdateOrder: 0,
  postUpdateOrder: 0,
  deferredUpdateOrder: 0,
  preDrawOrder: 0,
  midDrawOrder: 0,
  postDrawOrder: 0,
  resetOrder: 0,

  name: 'site_addon',

  onPreUpdate: null,
  onPostUpdate: null,
  onDeferredUpdate: null,
  onPreDraw: null,
  onMidDraw: null,
  onPostDraw: null,
  onReset: null,

  init: function (name = 'site_addon') {
    this.name = name;
  },
});

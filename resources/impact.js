// NOTE: THIS SCRIPT IS BASED OFF THE VERY GOOD WORK DONE BY DOMINIC A.K.A.
// PHOBOSLAB!!! I CANNOT MAKE THIS CLEAR ENOUGH!!!
// <https://github.com/phoboslab/Impact/blob/master/lib/impact/impact.js>

window.ig = {
  modules: {},

  _current: null,
  _loadQueue: [],
  _waitForOnload: 0,

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

    let path = 'resources/' + name.replace(/\./g, '/') + '.js';
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = path;
    script.onload = () => {
      ig._waitForOnload--;
      ig._execModules();
    };
    script.onerror = () => {
      throw new Error(`Failed to load module ${name} at ${path} required from ${requiredFrom}`);
    };
    document.getElementsByTagName('head')[0].appendChild(script);
  },

  _execModules() {
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
        module.loaded = true;
        module.body();
        modulesLoaded = true;
      }
    }
    if (modulesLoaded) {
      ig._execModules();
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
};

ig.module('impact')
  .requires('dom.ready', 'test')
  .defines(() => {
    console.log('impact');
    let p = document.createElement('p');
    p.textContent = `Loaded ${Object.keys(ig.modules).length} modules`;
    document.body.appendChild(p);
  });

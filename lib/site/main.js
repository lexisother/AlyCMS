ig.module('site.main')
  .requires('impact.base.plug-in', 'impact.feature.plug-in', 'site.elements', 'site.loader')
  .defines(() => {
    ig.Site = ig.Class.extend({
      events: new ig.EventManager(),

      init() {},

      // Our main event loop, calls the update methods of things that need
      // updating every tick
      run() {
        this.events.update();
      },

      // Ran when loader.load is called after loading is already complete.
      loadingComplete() {
        console.log('Loading ran twice? Somehow?');
      },
    });

    ig.system = new ig.System('#canvas', '#canvas-container', 60, 320, 260, 2);

    let loader = new ig.StartLoader(ig.Site);
    loader.load();
    ig.mainLoader = loader;
  });

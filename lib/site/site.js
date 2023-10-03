ig.module('site.site')
  .requires(
    'impact.base.impact',
    'impact.base.event',
    'impact.feature.gui.base.basic-gui',
    'site.feature.gui.button',
    'site.feature.gui.home',
  )
  .defines(() => {
    ig.Site = ig.Class.extend({
      events: new ig.EventManager(),

      addons: {
        all: [],
        preUpdate: [],
        postUpdate: [],
        deferredUpdate: [],
        preDraw: [],
        midDraw: [],
        postDraw: [],
        reset: [],
      },

      init() {
        this.addons.all = ig.initGameAddons();
        for (let addon of this.addons.all) {
          if (addon.onPreUpdate) this.addons.preUpdate.push(addon);
          if (addon.onPostUpdate) this.addons.postUpdate.push(addon);
          if (addon.onDeferredUpdate) this.addons.deferredUpdate.push(addon);
          if (addon.onPreDraw) this.addons.preDraw.push(addon);
          if (addon.onMidDraw) this.addons.midDraw.push(addon);
          if (addon.onPostDraw) this.addons.postDraw.push(addon);
          if (addon.onReset) this.addons.reset.push(addon);
        }
        this.addons.preUpdate.sort((a, b) => a.preUpdateOrder - b.preUpdateOrder);
        this.addons.postUpdate.sort((a, b) => a.postUpdateOrder - b.postUpdateOrder);
        this.addons.deferredUpdate.sort((a, b) => a.deferredUpdateOrder - b.deferredUpdateOrder);
        this.addons.preDraw.sort((a, b) => a.preDrawOrder - b.preDrawOrder);
        this.addons.midDraw.sort((a, b) => a.midDrawOrder - b.midDrawOrder);
        this.addons.postDraw.sort((a, b) => a.postDrawOrder - b.postDrawOrder);

        ig.gui.addGuiElement(new ig.HomeMenuGui());
      },

      // Our main event loop, calls the update methods of things that need
      // updating every tick
      run() {
        let context = ig.system.context;
        ig.system.context = null;
        let originalTick = ig.system.tick;
        let originalActualTick = ig.system.actualTick;
        let t = originalActualTick;
        while (t > 0) {
          ig.system.actualTick = Math.min(1 / 20, t);
          ig.system.tick = ig.system.actualTick * ig.system.timeFactor;
          this.update();
          t -= ig.system.actualTick;
        }
        ig.system.tick = originalTick;
        ig.system.actualTick = originalActualTick;
        ig.system.context = context;

        this.deferredUpdate();

        this.draw();
      },

      update() {
        for (let addon of this.addons.preUpdate) addon.onPreUpdate();

        this.events.update();

        for (let addon of this.addons.postUpdate) addon.onPostUpdate();
      },

      deferredUpdate() {
        for (let addon of this.addons.deferredUpdate) addon.onDeferredUpdate();
      },

      draw() {
        ig.system.clear('#000'); // TODO: are we sure we want to do this?

        for (let addon of this.addons.preDraw) addon.onPreDraw();

        for (let addon of this.addons.midDraw) addon.onMidDraw();

        ig.imageAtlas.fillFragments();

        for (let addon of this.addons.postDraw) addon.onPostDraw();
      },

      // Ran when loader.load is called after loading is already complete.
      loadingComplete() {
        console.log('Loading ran twice? Somehow?');
      },
    });
  });

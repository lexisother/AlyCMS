ig.module('site.main')
  .requires(
    'impact.base.plug-in',
    'impact.feature.plug-in',
    'site.elements',
    // 'site.test',
  )
  .defines(() => {
    ig.Site = ig.Class.extend({
      events: new ig.EventManager(),

      init() {},

      run() {
        this.events.update();
      }
    });
    ig.site = new ig.Site();

    ig.system = new ig.System('#canvas', '#canvas-container', 60, 320, 260, 2);
    ig.system.setDelegateNow(ig.site);
  });

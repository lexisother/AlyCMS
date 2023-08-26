ig.module('site.main')
  .requires('impact.base.plug-in', 'impact.feature.plug-in', 'site.elements')
  .defines(() => {
    ig.Site = ig.Class.extend({
      events: new ig.EventManager(),

      init() {
        // Baby's first "event loop", frankly I need a better system for this, but it works for now
        setInterval(() => {
          this.events.update();
        }, 1e3 / 60);
      },
    });
    ig.site = new ig.Site();
  });

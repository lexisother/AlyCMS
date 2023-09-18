ig.module('site.main')
  .requires('impact.base.plug-in', 'impact.feature.plug-in', 'site.elements', 'site.loader')
  .defines(() => {
    ig.Site = ig.Class.extend({
      events: new ig.EventManager(),

      init() {
        this.textBlock = new ig.TextBlock(
          ig.three,
          'Welcome to my\\..\\..\\.. funny website :)\nSilly things happen here',
          {
            speed: 0.03
          },
        );
      },

      // Our main event loop, calls the update methods of things that need
      // updating every tick
      run() {
        this.events.update();

        this.textBlock.update()
        this.textBlock.draw(20, 20);
      },

      // Ran when loader.load is called after loading is already complete.
      loadingComplete() {
        console.log('Loading ran twice? Somehow?');
      },
    });

    ig.system = new ig.System('#canvas', '#canvas-container', 60, 320, 260, 2);

    window.IG_DEBUG = true;
    ig.one = new ig.JsonLoadable('/resources/test.json');
    ig.two = new ig.Image('/lib/test.png');
    ig.three = new ig.MultiFont('/resources/font.png', 8);

    let loader = new ig.StartLoader(ig.Site);
    loader.load();
    ig.mainLoader = loader;
  });

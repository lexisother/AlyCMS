ig.module("site.site")
  .requires("impact.base.impact", "impact.base.event")
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
  });
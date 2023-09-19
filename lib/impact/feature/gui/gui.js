ig.module('impact.feature.gui.gui').defines(() => {
  ig.Gui = ig.SiteAddon.extend({
    textBlock: null,

    init() {
      this.parent('GUI');

      this.textBlock = new ig.TextBlock(
        ig.three,
        'Welcome to my\\..\\..\\.. funny website :)\nSilly things happen here!',
        {
          speed: ig.TextBlock.SPEED.SLOW,
        },
      );
    },

    postUpdateOrder: 500,
    onPostUpdate() {
      this.textBlock.update();
    },

    postDrawOrder: 500,
    onPostDraw() {
      this.textBlock.draw(20, 20);
    },
  });

  ig.addAddon(() => {
    return (ig.gui = new ig.Gui());
  });
});

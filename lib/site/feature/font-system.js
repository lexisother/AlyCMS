ig.module('site.feature.font-system')
  .requires('impact.base.font')
  .defines(() => {
    let ICON_MAPPING = {
      lb: [0, 0],
      rb: [0, 1],
      warn: [0, 2],
    };

    ig.FontSystem = ig.SiteAddon.extend({
      icons: {
        global: new ig.Font(
          '/resources/icons.png',
          8,
          ig.MultiFont.ICON_START
        )
      },
      font: new ig.MultiFont('/resources/font.png', 8),

      init() {
        this.parent("FontSystem");
        this.font.pushIconSet(this.icons.global);
        this.font.setMapping(ICON_MAPPING);
      },
    })

    ig.fontsystem = new ig.FontSystem();
    ig.addAddon(() => {
      return ig.fontsystem;
    });
  });
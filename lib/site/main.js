ig.module('site.main')
  .requires('impact.base.impact', 'site.site', 'site.elements', 'site.loader')
  .defines(() => {
    window.IG_DEBUG = true;
    ig.one = new ig.JsonLoadable('/resources/test.json');
    ig.two = new ig.Image('/lib/test.png');

    let ICON_MAPPING = {
      lb: [0, 0],
      rb: [0, 1],
      warn: [0, 2]
    };
    ig.three = new ig.MultiFont('/resources/font.png', 8);
    ig.four = new ig.Font('/resources/icons.png', 8, ig.MultiFont.ICON_START);
    ig.three.pushIconSet(ig.four);
    ig.three.setMapping(ICON_MAPPING);

    ig.main('#canvas', '#canvas-container', ig.Site, 60, 320, 260, 2, ig.StartLoader);
  });

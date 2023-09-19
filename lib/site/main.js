ig.module('site.main')
  .requires('impact.base.impact', 'site.site', 'site.elements', 'site.loader')
  .defines(() => {
    window.IG_DEBUG = true;
    ig.one = new ig.JsonLoadable('/resources/test.json');
    ig.two = new ig.Image('/lib/test.png');
    ig.three = new ig.MultiFont('/resources/font.png', 8);

    ig.main('#canvas', '#canvas-container', ig.Site, 60, 320, 260, 2, ig.StartLoader);
  });

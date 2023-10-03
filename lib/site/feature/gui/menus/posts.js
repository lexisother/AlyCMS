ig.module('site.feature.gui.menus.posts')
  .requires('impact.base.impact', 'impact.feature.gui.base.basic-gui', 'site.feature.gui.menu')
  .defines(() => {
    ig.PostsMenuGui = ig.BaseMenu.extend({
      init() {
        this.parent('postsMenu', this);

        this.textGui = new ig.TextGui('HOLY CRAP', { speed: 0.05 });
        this.textGui.hook.zIndex = 99;
        this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
        this.textGui.setPos(0, 10); // small bit of padding
        this.textGui.doStateTransition('HIDDEN', true);
        this.addChildGui(this.textGui);

        this.backButton = new ig.ButtonGui('<', 24);
        this.backButton.hook.transitions = {
          DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE },
          HIDDEN: {
            state: { offsetX: -(this.backButton.hook.size.x + 2) },
            time: 0.2,
            timeFunction: KEY_SPLINES.LINEAR,
          },
        };
        this.backButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
        this.backButton.setHeight(18);
        this.backButton.textChild.setPos(0, 2);
        this.backButton.setPos(2, 2);
        this.backButton.onMouseInteract = (_, c) => c && this.backPressed();
        this.backButton.doStateTransition('HIDDEN', true);
        this.addChildGui(this.backButton);
      },

      backPressed() {
        this.hide();
        ig.gui.namedGuiElements.homeMenu.show();
      },
    });
  });

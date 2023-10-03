ig.module('site.feature.gui.menus.home')
  .requires('impact.base.impact', 'impact.feature.gui.base.basic-gui', 'site.feature.gui.menu')
  .defines(() => {
    ig.HomeMenuGui = ig.BaseMenu.extend({
      init(showByDefault) {
        this.parent('homeMenu', this);

        this.textGui = new ig.TextGui(
          'Hello!\nWelcome to my personal website =w=\n\n{s:5}{i:warn} THIS WEBSITE IS UNDER CONSTRUCTION!!! {i:warn}',
          { speed: 0.05 },
        );
        this.textGui.hook.zIndex = 99;
        this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
        this.textGui.setPos(0, 10); // small bit of padding
        this.textGui.doStateTransition('HIDDEN', true);
        this.addChildGui(this.textGui);

        // this.textGui = new ig.TextGui('Color GUI', {speed: 0});
        // this.colorGui = new ig.ColorGui('red', 20, 20);
        // this.colorGui.hook.zIndex = 2;
        // this.colorGui.setPos(60, 60);
        // this.addChildGui(this.colorGui);

        // this.imageGui = new ig.ImageGui(ig.two, 0, 0, 200, 200);
        // this.imageGui.hook.zIndex = 1;
        // this.imageGui.setPos(20, 40);
        // this.addChildGui(this.imageGui);

        // this.buttonGui = new ig.ButtonGui('Hello', 40);
        // this.buttonGui.hook.zIndex = 3;
        // this.buttonGui.setPos(60, 85);
        // this.addChildGui(this.buttonGui);

        this.postsButton = new ig.ButtonGui('Posts', 64);
        this.postsButton.hook.transitions = {
          DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE },
          HIDDEN: {
            state: { offsetX: -(this.postsButton.hook.size.x + 10) },
            time: 0.2,
            timeFunction: KEY_SPLINES.LINEAR,
          },
        };
        this.postsButton.setAlign(ig.GUI_ALIGN_X.LEFT, ig.GUI_ALIGN_Y.BOTTOM);
        this.postsButton.setHeight(18);
        this.postsButton.textChild.setPos(0, 2);
        this.postsButton.setPos(10, 10);
        this.postsButton.onMouseInteract = (_, c) => c && this.postsPressed();
        this.postsButton.doStateTransition('HIDDEN', true);
        this.addChildGui(this.postsButton);

        this.signinButton = new ig.ButtonGui('Sign In', 64);
        this.signinButton.hook.transitions = {
          DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE },
          HIDDEN: {
            state: { offsetX: -(this.signinButton.hook.size.x + 2) },
            time: 0.2,
            timeFunction: KEY_SPLINES.LINEAR,
          },
        };
        this.signinButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
        this.signinButton.setHeight(18);
        this.signinButton.textChild.setPos(0, 2);
        this.signinButton.setPos(2, 2);
        this.signinButton.onMouseInteract = (_, c) => c && this.signinPressed();
        this.signinButton.doStateTransition('HIDDEN', true);
        this.addChildGui(this.signinButton);

        showByDefault && this.show();
      },

      signinPressed() {
        window.location.href = '/cms';
      },

      postsPressed() {
        this.hide();
        ig.gui.namedGuiElements.postsMenu.show();
      },
    });
  });

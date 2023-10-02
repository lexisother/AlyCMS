ig.module('site.feature.gui.button')
  .requires('impact.feature.gui.base.text')
  .defines(() => {
    let BUTTON_FOCUS_ANIM_TIME = 0.1;
    let BUTTON_ALPHA_DURATION = 1;

    ig.ButtonGui = ig.GuiElementBase.extend({
      text: null,
      bgGui: null,
      focusTimer: 0,
      alphaTimer: 0,
      data: null,
      noFocusOnPressed: false,

      transition: {
        DEFAULT: { state: {}, time: 0.3, timeFunction: KEY_SPLINES.EASE_OUT },
        HIDDEN: {
          state: { alpha: 0, scaleX: 0, scaleY: 0 },
          time: 0.3,
          timeFunction: KEY_SPLINES.EASE_IN,
        },
      },

      textChild: null,

      init(text, width) {
        this.parent();
        this.hook.setMouseRecord(true);

        this.setSize(0, 24);
        this.setPivot(72, 14);
        this.hook.size.y = 24;
        this.text = text;

        this.textChild = new ig.TextGui(this.text, { speed: ig.TextBlock.SPEED.IMMEDIATE });
        this.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
        this.textChild.setPos(0, 0);

        this.hook.size.x =
          Math.ceil(width / 2) * 2 || Math.ceil(this.textChild.hook.size.x / 2 + 12) * 2;

        this.bgGui = new ig.ColorGui('red', this.hook.size.x, this.hook.size.y);
        this.addChildGui(this.bgGui);

        this.addChildGui(this.textChild);
      },

      onMouseInteract(mouseOver, clicked) {
        console.log(mouseOver, clicked);
      },

      // updateDrawables(renderer) {
      //     renderer.addDraw().setColor(this.bgGui)
      // },

      setData(data) {
        if (data) this.data = data;
      },

      setWidth(width) {
        this.hook.size.x = width;
        this.hook.pivot.x = width / 2;
        this.bgGui.hook.size.x = width;
      },

      setHeight(height) {
        this.hook.size.y = height;
        this.hook.pivot.y = height / 2;
        this.bgGui.hook.size.y = height;
      },

      setText(text, ignoreWidth) {
        this.text = text;
        this.textChild.setText(text);
        if (ignoreWidth) return;
        let width = Math.ceil(this.textChild.hook.size.x / 2 + 12) * 2;
        this.setWidth(width);
      },

      resetText() {
        this.textChild.setText(this.text);
        let width = Math.ceil(this.textChild.hook.size.x / 2 + 12) * 2;
        this.setWidth(width);
      },

      unsetFocus() {
        this.focus = false;
        this.alphaTimer = 0;
        this.focusTimer = 0;
      },

      update() {
        this.parent();

        if (this.keepPressed && this.pressed && !this.noFocusOnPressed) {
          this.focusTimer += ig.system.actualTick;
          if (this.focusTimer > BUTTON_FOCUS_ANIM_TIME) this.focusTimer = BUTTON_FOCUS_ANIM_TIME;
          this.alphaTimer = 0;
        } else if (this.focus && this.focusTimer < BUTTON_FOCUS_ANIM_TIME) {
          this.focusTimer += ig.system.actualTick;
          this.alphaTimer = 0;
        } else if (!this.focus && this.focusTimer > 0) {
          this.focusTimer -= this.system.actualTick;
          this.alphaTimer = 0;
        } else {
          this.alphaTimer = (this.alphaTimer + ig.system.actualTick) % BUTTON_ALPHA_DURATION;
        }
        this.focusTimer.limit(0, BUTTON_FOCUS_ANIM_TIME);

        if (this.keepPressed && this.pressed) this.bgGui.color = 'blue';
        else this.bgGui.color = 'purple';
      },
    });
  });

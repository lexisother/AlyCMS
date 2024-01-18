ig.module('impact.feature.gui.base.text')
  .requires('impact.base.font', 'impact.feature.gui.gui', 'site.feature.font-system')
  .defines(() => {
    ig.TextGui = ig.GuiElementBase.extend({
      font: null,
      text: '',
      textBlock: null,
      stopped: false,
      transitions: {
        DEFAULT: {state: {}, time: 0.1, timeFunction: KEY_SPLINES.EASE},
        HIDDEN: {state: {alpha: 0}, time: 0.1, timeFunction: KEY_SPLINES.EASE},
      },

      init(text, settings = {}) {
        this.parent();

        this.font = settings.font ?? ig.fontsystem.font;
        this.text = text;
        this.textBlock = new ig.TextBlock(this.font, text, settings);

        this.hook.size.x = this.textBlock.size.x;
        this.hook.size.y = this.textBlock.size.y;
        this.hook.pivot.x = Math.floor(this.hook.size.x / 2);
        this.hook.pivot.y = Math.floor(this.hook.size.y / 2);
      },

      onVisibilityChange(visible) {
        if (visible) this.textBlock.prerender();
        else this.textBlock.clearPrerendered();
      },

      setMaxWidth(width) {
        this.textBlock.maxWidth = width || 0;
        this.setText(this.text);
      },

      setTextAlign(align) {
        this.textBlock.align = align;
      },

      setTextSpeed(speed) {
        this.textBlock.speed = speed;
      },

      setFont(font, newLinePadding) {
        if (font && font !== this.font) {
          this.font = font;
          this.textBlock.font = font;
          if (newLinePadding) this.textBlock.linePadding = newLinePadding || 0;
          this.setText(this.text);
        }
      },

      setText(text) {
        this.text = text;
        this.textBlock.setText(text);
        if (this.isVisible()) this.textBlock.prerender();
        this.hook.size.x = this.textBlock.size.x;
        this.hook.size.y = this.textBlock.size.y;
        this.hook.pivot.x = Math.floor(this.hook.size.x / 2);
        this.hook.pivot.y = Math.floor(this.hook.size.y / 2);
        this.stopped = false;
      },

      clear() {
        this.textBlock.clearPrerendered();
      },

      finish() {
        this.textBlock.finish();
      },

      stop() {
        this.stopped = true;
      },

      reset() {
        this.textBlock.reset();
      },

      resume() {
        this.stopped = false;
      },

      getTextState() {
        return this.textBlock.getState();
      },
      setTextState(state) {
        this.textBlock.setState(state);
      },

      updateDrawables(renderer) {
        renderer.addDraw().setText(this.textBlock, 0, 0);
      },

      onAttach() {
        if (this.isVisible()) this.textBlock.prerender();
      },

      onDetach() {
        this.textBlock.clearPrerendered();
      },
    });
  });

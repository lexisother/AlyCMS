ig.module('site.feature.gui.menu')
  .requires('impact.feature.gui.base.basic-gui')
  .defines(() => {
    ig.BaseMenu = ig.GuiElementBase.extend({
      elements: [],

      init(name, clazz) {
        this.parent();

        if (name && !clazz) throw new Error('ig.BaseMenu: name provided but no class?');
        clazz && (ig.gui.namedGuiElements[name] = clazz);

        // Cover the entire screen, otherwise all the UI will be crippled into the top left
        this.hook.zIndex = 1000;
        this.hook.size.x = ig.system.width;
        this.hook.size.y = ig.system.height;
      },

      addChildGui(guiElement) {
        this.parent(guiElement);
        this.elements.push(guiElement);
      },

      show() {
        for (let el of this.elements) {
          el.doStateTransition('DEFAULT');
        }
      },

      hide() {
        for (let el of this.elements) {
          el.doStateTransition('HIDDEN');
        }
      },
    });
  });

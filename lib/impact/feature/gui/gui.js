ig.module('impact.feature.gui.gui').defines(() => {
  function sortGUI(a, b) {
    return a.zIndex - b.zIndex;
  }

  let c_clippingStack = [],
    c_transformStack = [];

  let GuiRenderer = ig.Class.extend({
    drawSteps: [],

    // CONVENIENT METHODS
    // ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
    addGfx: function (gfx, posX, posY, srcX, srcY, sizeX, sizeY, flipX, flipY) {
      return this.addDraw().setGfx(gfx, posX, posY, srcX, srcY, sizeX, sizeY, flipX, flipY);
    },
    addGfxTile: function (gfx, posX, posY, tile, tileWidth, tileHeight, flipX, flipY) {
      return this.addDraw().setGfxTile(gfx, posX, posY, tile, tileWidth, tileHeight, flipX, flipY);
    },
    addColor: function (color, posX, posY, sizeX, sizeY) {
      return this.addDraw().setColor(color, posX, posY, sizeX, sizeY);
    },
    addText: function (text, posX, posY) {
      return this.addDraw().setText(text, posX, posY);
    },

    // METHODS
    // ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
    clearDrawSteps: function () {
      while (this.drawSteps.length) {
        let step = this.drawSteps.pop();
        step && step.kill();
      }
    },
    addDraw: function () {
      let step = c_guiStepPool.get(ig.GuiDrawable);
      this.drawSteps.push(step);
      return step;
    },
    addTransform: function () {
      let step = c_guiStepPool.get(ig.GuiTransform);
      this.drawSteps.push(step);
      return step;
    },
    undoTransform: function () {
      this.drawSteps.push(null);
    },

    draw: function () {
      let system = ig.system,
        context = system.context,
        scale = system.scale;
      let x = 0,
        y = 0;
      let steps = this.drawSteps,
        stepLength = steps.length;
      for (let i = 0; i < stepLength; ++i) {
        let step = steps[i];
        if (!step) {
          // Undo Transform
          let transform = c_transformStack.pop();
          if (!transform) {
            throw new Error('Gui Draw: tried to undo non existing transform. Too many undos?');
          }
          if (transform.isComplex()) {
            context.restore();
            x = transform.prePos.x;
            y = transform.prePos.y;
          } else {
            x -= system.getDrawPos(transform.translate.x) / scale;
            y -= system.getDrawPos(transform.translate.y) / scale;
          }
          if (transform.alpha !== 1) {
            context.globalAlpha = transform.preAlpha;
          }
        } else if (step.draw) {
          step.draw(x, y);
        } else if (step.transform) {
          c_transformStack.push(step);
          if (step.isComplex()) {
            step.transform(x, y);
            x = y = 0;
          } else {
            x += system.getDrawPos(step.translate.x) / scale;
            y += system.getDrawPos(step.translate.y) / scale;
          }
          if (step.alpha !== 1) {
            step.preAlpha = context.globalAlpha;
            context.globalAlpha *= step.alpha;
          }
        }
      }
      if (c_transformStack.length > 0) {
        throw new Error('Exited gui draw with transform remaining. Forgot to undo transform');
      }
    },
  });

  let BUTTON_Z_INDEX = 0;

  ig.Gui = ig.SiteAddon.extend({
    guiHooks: [],
    namedGuiElements: {},
    screenBlocked: false,
    renderer: new GuiRenderer(),
    mouseListenerHooks: [],

    init: function () {
      this.parent('GUI');
    },

    // ADDON API -------------------------------------------------------------------------------------------------------

    deferredUpdateOrder: 500,
    onDeferredUpdate: function () {
      this.screenBlocked = false;
      this.renderer.clearDrawSteps();
      this._updateGuiMouse();
      BUTTON_Z_INDEX = 0;
      this._updateRecursive(
        0,
        0,
        ig.system.width,
        ig.system.height,
        c_clippingStack,
        true,
        this.guiHooks,
        0,
        0,
        1,
        true,
      );
    },

    postDrawOrder: 500,
    onPostDraw: function () {
      this.renderer.draw();
    },

    onReset: function () {
      for (let name in this.namedGuiElements) {
        this.namedGuiElements[name].remove();
        //this.removeGuiElement(this.namedGuiElements[name]);
      }
      this.namedGuiElements = {};
      let i = this.guiHooks.length;
      while (i--) {
        if (this.guiHooks[i].temporary) {
          this.guiHooks[i].onDetach();
          this.guiHooks.splice(i, 1);
        }
      }
    },

    // -----------------------------------------------------------------------------------------------------------------
    /** Prints out the gui elements found in ig.GUI*/
    logGUIArray: function () {
      console.groupCollapsed('GUI Array Elements:');
      for (let el in ig.GUI) {
        if (ig.GUI[el]) console.log(el);
      }
      console.groupEnd();
    },

    createEventGui: function (name, type, settings, free) {
      let guiClass = ig.GUI[type];
      if (!guiClass) return null;
      let guiElement = new guiClass(settings);
      guiElement.hook.mapGuiInfo = {
        name: name,
        type: type,
        settings: settings,
        free: free || false,
      };
      return guiElement;
    },

    /** Spawn a gui from an event. Only these gui elements should have a name. */
    spawnEventGui: function (guiElement) {
      let info = guiElement.hook.mapGuiInfo;
      let guiClass = ig.GUI[info.type];
      this.namedGuiElements[info.name] = guiElement;
      if (guiClass.spawnHandler) {
        guiElement.hook.removeAfterTransition = false;
        guiClass.spawnHandler(guiElement);
      } else this.addGuiElement(guiElement);
    },

    /** This methods is called by the event step that spawns the event gui. Two things map happen:
     * 1. The event gui is currently not visible => release all data connected to the GUI
     * 2. The event gui is currently visible => mark the event gui as "free" so that it's data is release when it is removed
     */
    freeEventGui: function (guiElement) {
      if (!guiElement) return;
      if (guiElement.hook.parentHook) {
        // Gui is currently active, mark it as free
        guiElement.hook.mapGuiInfo.free = true;
      } else {
        guiElement.clearCached && guiElement.clearCached();
      }
    },

    addGuiElement: function (guiElement) {
      let hook = guiElement.hook;
      hook.removeAfterTransition = false; // In case we add a previously removed GUI element
      if (this.guiHooks.indexOf(hook) === -1) {
        this.guiHooks.push(hook);
        this.guiHooks.sort(sortGUI);
        hook.onAttach(this);
      }
    },

    sortGui: function () {
      this.guiHooks.sort(sortGUI);
    },

    removeGuiElement: function (guiElement) {
      this.guiHooks.erase(guiElement.hook);
    },

    _updateGuiMouse: function () {
      let x = ig.input.mouse.x;
      let y = ig.input.mouse.y;

      let mouseOverGui = null;
      let clicked = ig.input.mouse.clicked;

      for (let i = 0; i < this.mouseListenerHooks.length; ++i) {
        let hook = this.mouseListenerHooks[i];
        if (!hook._visible) continue;

        if (!hook.screenCoords) {
          hook.screenCoords = {
            x: 0,
            y: 0,
            w: hook.size.x,
            h: hook.size.y,
            active: false,
            zIndex: 0,
          };
          calculateScreenCoords(hook.screenCoords, hook);
        }

        let coords = hook.screenCoords;
        if (!coords.active) continue;

        let isMouseOver = false;
        if (hook.gui.isMouseOver) {
          isMouseOver = hook.gui.isMouseOver();
        } else {
          isMouseOver =
            coords.x <= x && coords.x + coords.w > x && coords.y <= y && coords.y + coords.h > y;
        }

        // TODO: Better abstraction for mouse clicks

        if (isMouseOver) {
          if (mouseOverGui) {
            if (mouseOverGui.screenCoords.zIndex < hook.screenCoords.zIndex) {
              mouseOverGui.mouseOver = false;
              mouseOverGui.gui.onMouseInteract && mouseOverGui.gui.onMouseInteract(false, false);
              mouseOverGui = hook;
            } else {
              isMouseOver = false;
            }
          } else {
            mouseOverGui = hook;
          }
        }
        if (!isMouseOver) {
          hook.mouseOver = isMouseOver;
          hook.gui.onMouseInteract && hook.gui.onMouseInteract(false, false);
        }
      }
      if (mouseOverGui) {
        mouseOverGui.mouseOver = true;
        mouseOverGui.gui.onMouseInteract && mouseOverGui.gui.onMouseInteract(true, clicked);
      }

      ig.input.mouse.clicked = false;
    },

    _updateRecursive: function (
      scrollX,
      scrollY,
      parentWidth,
      parentHeight,
      clippingStack,
      parentVisible,
      guiHooks,
      screenX,
      screenY,
      alpha,
      parentDoUpdate,
    ) {
      let hasClipping = clippingStack.length > 0,
        subtreeTransitions = false;

      for (let i = 0; i < guiHooks.length; ++i) {
        let clipX, clipY, clipW, clipH;
        if (hasClipping) {
          clipX = clippingStack[clippingStack.length - 4];
          clipY = clippingStack[clippingStack.length - 3];
          clipW = clippingStack[clippingStack.length - 2];
          clipH = clippingStack[clippingStack.length - 1];
        }

        let hook = guiHooks[i];

        let doUpdate =
          parentDoUpdate && (guiHooks !== this.guiHooks || hook.pauseGui || !ig.paused);

        if (doUpdate && hook.updateState()) {
          hook.onDetach();
          guiHooks.splice(i, 1);
          i--;
          if (hook.mapGuiInfo) {
            let key = hook.mapGuiInfo.name;
            if (this.namedGuiElements[key] === hook.gui)
              delete this.namedGuiElements[hook.mapGuiInfo.name];
            if (hook.mapGuiInfo.free) {
              hook.gui.clearCached && hook.gui.clearCached();
            }
          }
          continue;
        }

        let noUpdateDueToInvisible = doUpdate;
        if (doUpdate && (hook._visible || hook.invisibleUpdate)) {
          noUpdateDueToInvisible = false;
          hook.gui.update();
        }

        let guiW = hook.size.x,
          guiH = hook.size.y;
        let x = scrollX,
          y = scrollY;
        let tScreenX = screenX,
          tScreenY = screenY;
        x += getOffsetX(hook, parentWidth);
        y += getOffsetY(hook, parentHeight);

        let state = hook.currentState;

        let subAlpha = alpha * state.alpha;

        if (state.alpha === 1 && hook.screenBlocking) {
          ig.gui.screenBlocked = true;
        }

        x += hook.align.x === ig.GUI_ALIGN.X_RIGHT ? -state.offsetX : state.offsetX;
        y += hook.align.y === ig.GUI_ALIGN.Y_BOTTOM ? -state.offsetY : state.offsetY;

        tScreenX += x;
        tScreenY += y;

        let visible = parentVisible && subAlpha > 0.01 && state.scaleX !== 0 && state.scaleY !== 0;
        if (visible && hasClipping) {
          clipX -= x;
          clipY -= y;
          if (state.scaleX !== 1 || state.scaleY !== 1 || state.angle !== 0) {
            clipX -= hook.pivot.x;
            clipY -= hook.pivot.y;
            clipX /= Math.abs(state.scaleX);
            clipY /= Math.abs(state.scaleY);
            clipX += hook.pivot.x;
            clipY += hook.pivot.y;
            clipW /= Math.abs(state.scaleX);
            clipH /= Math.abs(state.scaleY);
          }
          visible = !(0 >= clipX + clipW || 0 >= clipY + clipH || guiW <= clipX || guiH <= clipY);
        }

        if (hook.screenCoords) {
          BUTTON_Z_INDEX++;
          hook.screenCoords.x = tScreenX;
          hook.screenCoords.y = tScreenY;
          hook.screenCoords.w = hook.size.x; // TODO consider scaling here - if we ever need it
          hook.screenCoords.h = hook.size.y;
          hook.screenCoords.active = doUpdate;
          hook.screenCoords.zIndex = BUTTON_Z_INDEX;
          if (hasClipping) {
            if (clipX > 0) {
              hook.screenCoords.x += clipX;
              hook.screenCoords.w -= clipX;
            }
            if (clipY > 0) {
              hook.screenCoords.y += clipY;
              hook.screenCoords.h -= clipY;
            }
            hook.screenCoords.w = Math.min(hook.screenCoords.w, clipW + (clipX < 0 ? clipX : 0));
            hook.screenCoords.h = Math.min(hook.screenCoords.h, clipH + (clipY < 0 ? clipY : 0));
          }
        }

        if (noUpdateDueToInvisible && visible) {
          hook.gui.update();
        }

        if (
          !hook._subState.subtreeTransition &&
          !visible &&
          !hook._visible &&
          !hook.invisibleUpdate
        ) {
          continue;
        }

        let transformStep = this.renderer.addTransform();
        transformStep.setTranslate(x, y);
        transformStep.setScale(state.scaleX, state.scaleY);
        transformStep.setPivot(hook.pivot.x, hook.pivot.y);
        transformStep.setRotate(state.angle);
        transformStep.setAlpha(subAlpha);
        if (hook.clip) {
          transformStep.setClip(hook.size.x, hook.size.y);
        }

        let guiClip = hook.clip;
        if (visible && (hasClipping || guiClip)) {
          if (!guiClip) {
            clippingStack.push(clipX, clipY, clipW, clipH);
          } else if (!hasClipping) {
            clippingStack.push(0, 0, guiW, guiH);
          } else {
            let maxLeft = Math.max(clipX, 0),
              maxTop = Math.max(clipY, 0),
              minRight = Math.min(clipX + clipW, guiW),
              minBottom = Math.min(clipY + clipH, guiH);
            clippingStack.push(maxLeft, maxTop, minRight - maxLeft, minBottom - maxTop);
          }
        }

        setGuiHookVisible(hook, visible);

        if (hook.localAlpha > 0) {
          if (hook.localAlpha !== 1) {
            this.renderer.addTransform().setAlpha(hook.localAlpha);
          }
          hook.gui.updateDrawables(this.renderer);

          if (hook.localAlpha !== 1) {
            this.renderer.undoTransform();
          }
        }

        let childSubtreeTransition = this._updateRecursive(
          hook.scroll.x,
          hook.scroll.y,
          guiW,
          guiH,
          clippingStack,
          visible,
          hook.children,
          tScreenX,
          tScreenY,
          subAlpha,
          doUpdate,
        );
        hook._subState.subtreeTransition = hook.hasTransition() || childSubtreeTransition;
        subtreeTransitions = subtreeTransitions || hook._subState.subtreeTransition;

        if (visible && (hasClipping || guiClip)) {
          clippingStack.length = clippingStack.length - 4;
        }

        this.renderer.undoTransform();
      }
      return subtreeTransitions;
    },

    _drawRecursive: function (scrollX, scrollY, parentWidth, parentHeight, guiHooks) {
      let context = ig.system.context;

      for (let i = 0; i < guiHooks.length; ++i) {
        let hook = guiHooks[i];
        let x = scrollX,
          y = scrollY;
        switch (hook.align.x) {
          case ig.GUI_ALIGN.X_LEFT:
            x += hook.pos.x;
            break;
          case ig.GUI_ALIGN.X_RIGHT:
            x += parentWidth - hook.size.x - hook.pos.x;
            break;
          case ig.GUI_ALIGN.X_CENTER:
            x += Math.floor(parentWidth / 2 - hook.size.x / 2 + hook.pos.x);
            break;
        }
        switch (hook.align.y) {
          case ig.GUI_ALIGN.Y_TOP:
            y += hook.pos.y;
            break;
          case ig.GUI_ALIGN.Y_BOTTOM:
            y += parentHeight - hook.size.y - hook.pos.y;
            break;
          case ig.GUI_ALIGN.Y_CENTER:
            y += Math.floor(parentHeight / 2 - hook.size.y / 2 + hook.pos.y);
            break;
        }

        let state = hook.currentState;
        if (!hook._visible)
          // Skip ig.GUI elements that are basically invisible
          continue;

        x += hook.align.x === ig.GUI_ALIGN.X_RIGHT ? -state.offsetX : state.offsetX;
        y += hook.align.y === ig.GUI_ALIGN.Y_BOTTOM ? -state.offsetY : state.offsetY;

        let preAlpha = context.globalAlpha,
          childAlpha = preAlpha * state.alpha,
          drawAlpha = childAlpha * hook.localAlpha;

        let didContextSave = false;
        if (hook.clip || state.scaleX !== 1 || state.scaleY !== 1 || state.angle !== 0) {
          didContextSave = true;
          context.save();
          context.translate(ig.system.getDrawPos(x), ig.system.getDrawPos(y));
          x = y = 0;
          if (hook.clip) {
            context.beginPath();
            context.rect(0, 0, hook.size.x, hook.size.y);
            context.clip();
          }
          if (state.scaleX !== 1 || state.scaleY !== 1 || state.angle !== 0) {
            context.translate(
              ig.system.getDrawPos(hook.pivot.x),
              ig.system.getDrawPos(hook.pivot.y),
            );
            context.rotate(state.angle);
            context.scale(state.scaleX, state.scaleY);
            context.translate(
              -ig.system.getDrawPos(hook.pivot.x),
              -ig.system.getDrawPos(hook.pivot.y),
            );
          }
        }
        let drawables = hook.drawables;
        if (drawAlpha > 0 && drawables.length > 0) {
          if (preAlpha !== drawAlpha) context.globalAlpha = drawAlpha;

          for (let j = 0; j < drawables.length; ++j) {
            drawables[j].draw(x, y);
          }
          if (drawAlpha !== childAlpha) context.globalAlpha = childAlpha;
        } else if (preAlpha !== childAlpha) context.globalAlpha = childAlpha;

        this._drawRecursive(
          hook.scroll.x + x,
          hook.scroll.y + y,
          hook.size.x,
          hook.size.y,
          hook.children,
        );

        if (preAlpha !== childAlpha) context.globalAlpha = preAlpha;

        if (didContextSave) ig.system.context.restore();
      }
    },

    _addMouseListenerHook: function (hook) {
      this.mouseListenerHooks.push(hook);
    },
    _removeMouseListenerHook: function (hook) {
      this.mouseListenerHooks.erase(hook);
    },
  });

  function getOffsetX(hook, parentWidth) {
    switch (hook.align.x) {
      case ig.GUI_ALIGN.X_LEFT:
        return hook.pos.x;
      case ig.GUI_ALIGN.X_RIGHT:
        return parentWidth - hook.size.x - hook.pos.x;
      case ig.GUI_ALIGN.X_CENTER:
        return Math.floor(parentWidth / 2 - hook.size.x / 2 + hook.pos.x);
    }
    return 0;
  }
  function getOffsetY(hook, parentHeight) {
    switch (hook.align.y) {
      case ig.GUI_ALIGN.Y_TOP:
        return hook.pos.y;
      case ig.GUI_ALIGN.Y_BOTTOM:
        return parentHeight - hook.size.y - hook.pos.y;
      case ig.GUI_ALIGN.Y_CENTER:
        return Math.floor(parentHeight / 2 - hook.size.y / 2 + hook.pos.y);
    }
    return 0;
  }

  ig.addAddon(() => {
    return (ig.gui = new ig.Gui());
  });

  ig.GUI = {};
  ig.GUI_ALIGN = {};

  ig.GUI_ALIGN.Y_TOP = 1;
  ig.GUI_ALIGN.Y_CENTER = 2;
  ig.GUI_ALIGN.Y_BOTTOM = 3;
  ig.GUI_ALIGN.X_LEFT = 4;
  ig.GUI_ALIGN.X_CENTER = 5;
  ig.GUI_ALIGN.X_RIGHT = 6;

  ig.GUI_ALIGN_X = {
    LEFT: ig.GUI_ALIGN.X_LEFT,
    RIGHT: ig.GUI_ALIGN.X_RIGHT,
    CENTER: ig.GUI_ALIGN.X_CENTER,
  };

  ig.GUI_ALIGN_Y = {
    TOP: ig.GUI_ALIGN.Y_TOP,
    BOTTOM: ig.GUI_ALIGN.Y_BOTTOM,
    CENTER: ig.GUI_ALIGN.Y_CENTER,
  };

  ig.GuiHook = ig.Class.extend({
    // CONFIGURABLE:
    pos: { x: 0, y: 0 },
    size: { x: 1, y: 1 },
    pivot: { x: 0, y: 0 },
    scroll: { x: 0, y: 0 },
    align: { x: ig.GUI_ALIGN.X_LEFT, y: ig.GUI_ALIGN.Y_TOP },
    parentHook: null,
    children: [], // child gui hooks
    mouseRecord: false,
    screenCoords: null,
    mouseOver: false,
    localAlpha: 1,
    zIndex: 0,
    pauseGui: false, // if true, then this GUI element will be updated even in pause mode
    invisibleUpdate: false, // if true, then this GUI element will be updated even if invisible
    screenBlocking: false, // if true this GUI will disable map drawing when fully opaque
    stateCallback: null,
    clip: false,
    temporary: false, // if true: remove this gui on reset!
    transitions: {
      DEFAULT: {
        state: {}, // should be subset of "currentState"
        time: 0.5, // transition time TO this state in seconds
        timeFunction: KEY_SPLINES['EASE'], // Transition function
      },
    },

    // STATIC:
    gui: null,
    currentState: {
      offsetX: 0,
      offsetY: 0,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
    },
    currentStateName: '',

    anim: {
      targetState: null,
      initState: null,
      timer: 0,
      maxTime: 0,
      timeFunction: null,
    },
    removeAfterTransition: false,

    posTransition: null,
    scrollTransition: null,
    _visible: false,
    _subState: {
      subtreeTransition: false,
    },
    mapGuiInfo: null,

    drawSteps: [],

    init: function (guiElement) {
      this.gui = guiElement;
      if (guiElement.transitions) {
        this.transitions = guiElement.transitions;
        this.doStateTransition('DEFAULT', true);
      }
    },
    setMouseRecord: function (mouseRecord) {
      if (this.mouseRecord !== mouseRecord) {
        this.mouseRecord = mouseRecord;
        if (this.parentHook) {
          if (mouseRecord) ig.gui._addMouseListenerHook(this);
          else ig.gui._removeMouseListenerHook(this);
        }
      }
    },
    onAttach: function (parent) {
      if (this.parentHook === parent) return;
      this.parentHook = parent;
      setGuiHookVisible(this, parent instanceof ig.Gui ? true : parent._visible);
      if (this.mouseRecord) {
        ig.gui._addMouseListenerHook(this);
      }
      this.gui.onAttach && this.gui.onAttach();
      let i = this.children.length;
      while (i--) {
        this.children[i].onAttach(this);
      }
    },

    onDetach: function () {
      if (!this.parentHook) return;
      if (this.mouseRecord) {
        this.screenCoords = null;
        ig.gui._removeMouseListenerHook(this);
      }
      let i = this.children.length;
      while (i--) {
        this.children[i].onDetach();
      }
      this.gui.onDetach && this.gui.onDetach();
      this.parentHook = null;
    },

    getChildGuiIndex: function (guiHook) {
      return this.children.indexOf(guiHook);
    },

    getChildGuiByIndex: function (index) {
      return this.children[index];
    },

    addChildHook: function (guiHook) {
      guiHook.removeAfterTransition = false; // In case we add a previously removed GUI element
      this.children.erase(guiHook);
      guiHook.onDetach();
      this.children.push(guiHook);
      this.parentHook && guiHook.onAttach(this);
    },
    insertChildHook: function (guiHook, index) {
      guiHook.removeAfterTransition = false;
      this.children.erase(guiHook);
      guiHook.onDetach();
      this.children.splice(index, 0, guiHook);
      this.parentHook && guiHook.onAttach(this);
    },
    removeChildHook: function (guiHook) {
      guiHook.removeAfterTransition = false;
      this.children.erase(guiHook);
      guiHook.onDetach();
    },
    removeChildHookByIndex: function (index) {
      let hook = this.children.splice(index, 1)[0];
      hook.removeAfterTransition = false;
      hook.onDetach();
      return hook;
    },
    removeAllChildren: function () {
      let i = this.children.length;
      while (i--) {
        this.children[i].onDetach();
        this.children[i].removeAfterTransition = false;
      }
      this.children.length = 0;
    },
    doStateTransition: function (name, skipTransition, removeAfter, callback, initDelay) {
      let transition = this.transitions[name];
      if (!transition) {
        throw new Error('No Transition found with name: ' + name);
      }

      if (this.removeAfterTransition) return;
      this.removeAfterTransition = removeAfter || false;
      this.stateCallback = null;

      if (!skipTransition) {
        let parent = this.parentHook;
        while (parent && parent !== ig.gui) {
          parent._subState.subtreeTransition = true;
          parent = parent.parentHook;
        }
      }

      if (this.currentStateName === name) {
        if (callback) this.stateCallback = callback;
        let newTime = skipTransition ? transition.time : 0 - (initDelay || 0);
        this.anim.timer = Math.max(this.anim.timer, newTime);
        return;
      }

      this.currentStateName = name;
      this._setStateData(
        transition.state,
        transition.time,
        transition.timeFunction,
        skipTransition,
        removeAfter,
        callback,
        initDelay,
      );
    },
    getStateTransitionProgress: function () {
      if (!this.anim.maxTime) return 1;
      return this.anim.timer / this.anim.maxTime;
    },
    doTempStateTransition: function (
      stateData,
      time,
      keySpline,
      skipTransition,
      removeAfter,
      callback,
      initDelay,
    ) {
      if (this.removeAfterTransition) return;
      this.removeAfterTransition = removeAfter || false;
      this.currentStateName = null;
      this._setStateData(
        stateData,
        time,
        keySpline,
        skipTransition,
        removeAfter,
        callback,
        initDelay,
      );
    },
    setScale: function (x, y) {
      this.currentState.scaleX = x;
      this.currentState.scaleY = y;
    },
    _setStateData: function (
      stateData,
      time,
      keySpline,
      skipTransition,
      removeAfter,
      callback,
      initDelay,
    ) {
      if (callback) this.stateCallback = callback;

      this.anim.initState = ig.copy(this.currentState);
      let newTargetState = { offsetX: 0, offsetY: 0, alpha: 1, scaleX: 1, scaleY: 1, angle: 0 };
      for (let i in stateData) {
        newTargetState[i] = stateData[i];
      }
      this.anim.targetState = newTargetState;
      this.anim.maxTime = time;
      this.anim.timer = skipTransition ? time : 0 - (initDelay || 0);
      this.anim.timeFunction = keySpline;
      if (skipTransition) this.currentState = ig.copy(newTargetState);
    },

    doPosTranstition: function (x, y, time, timeFunction, initDelay, preserveTime, endCallback) {
      if (preserveTime) {
        let oldTime = this.posTransition ? this.posTransition.time - this.posTransition.timer : 0;
        time = Math.max(time, oldTime);
      }

      if (!time || time <= 0) {
        this.pos.x = x;
        this.pos.y = y;
        this.posTransition = null;
        return;
      }

      this.posTransition = {
        startX: this.pos.x,
        startY: this.pos.y,
        x: x,
        y: y,
        time: time,
        timeFunction: timeFunction || KEY_SPLINES['EASE_IN_OUT'],
        timer: 0 - (initDelay || 0),
        endCallback: endCallback,
      };
    },

    doScrollTransition: function (x, y, time, timeFunction, endCallback) {
      if (
        !time ||
        time <= 0 ||
        (Math.abs(x - this.scroll.x) < 0.00001 && Math.abs(y - this.scroll.y) < 0.00001)
      ) {
        this.scroll.x = x;
        this.scroll.y = y;
        this.scrollTransition = null;
        return;
      }
      this.scrollTransition = {
        startX: this.scroll.x,
        startY: this.scroll.y,
        x: x,
        y: y,
        time: time,
        timeFunction: timeFunction || KEY_SPLINES['EASE_IN_OUT'],
        timer: 0,
        endCallback: endCallback || null,
      };
    },

    hasTransition: function () {
      return !!this.anim.targetState;
    },
    getTransitionFactor: function () {
      return (this.anim.timer / this.anim.maxTime).limit(0, 1);
    },

    setStateValue: function (state, attribute, value) {
      if (this.transitions[state]) {
        this.transitions[state]['state'][attribute] = value;
      }
    },

    updateState: function () {
      if (this.posTransition) {
        this.posTransition.timer += ig.system.actualTick;
        let i = Math.min(1, Math.max(0, this.posTransition.timer) / this.posTransition.time);
        i = this.posTransition.timeFunction.get(i);
        this.pos.x = this.posTransition.startX * (1 - i) + this.posTransition.x * i;
        this.pos.y = this.posTransition.startY * (1 - i) + this.posTransition.y * i;

        if (i === 1) {
          this.posTransition.endCallback && this.posTransition.endCallback();
          this.posTransition = null;
        }
      }
      if (this.scrollTransition) {
        this.scrollTransition.timer += ig.system.actualTick;
        let i = Math.min(1, this.scrollTransition.timer / this.scrollTransition.time);
        i = this.scrollTransition.timeFunction.get(i);
        this.scroll.x = this.scrollTransition.startX * (1 - i) + this.scrollTransition.x * i;
        this.scroll.y = this.scrollTransition.startY * (1 - i) + this.scrollTransition.y * i;

        if (i === 1) {
          if (this.scrollTransition.endCallback) {
            this.scrollTransition.endCallback();
          }
          this.scrollTransition = null;
        }
      }
      if (this.anim.targetState) {
        this.anim.timer += ig.system.actualTick;
        let i = (this.anim.timer / this.anim.maxTime).limit(0, 1);
        i = this.anim.timeFunction.get(i);
        for (let key in this.anim.targetState) {
          this.currentState[key] =
            (1 - i) * this.anim.initState[key] + i * this.anim.targetState[key];
        }
        if (i === 1) {
          this.anim.targetState = null;
          if (this.stateCallback) {
            let callback = this.stateCallback;
            this.stateCallback = null;
            callback();
          }
          return this.removeAfterTransition;
        } else {
          return false;
        }
      }
      return this.removeAfterTransition;
    },
  });

  function setGuiHookVisible(hook, visible) {
    if (visible !== hook._visible) {
      hook._visible = visible;
      if (hook.gui.onVisibilityChange) hook.gui.onVisibilityChange(visible);
    }
  }
  function calculateScreenCoords(screenCoords, node) {
    let parent = node.parentHook;
    let width, height;
    if (parent instanceof ig.Gui) {
      screenCoords.active = node.pauseGui || !ig.paused;
      width = ig.system.width;
      height = ig.system.height;
    } else {
      calculateScreenCoords(screenCoords, parent);
      screenCoords.x += parent.scroll.x;
      screenCoords.y += parent.scroll.y;
      width = parent.size.x;
      height = parent.size.y;
    }
    screenCoords.x += getOffsetX(node, width);
    screenCoords.y += getOffsetY(node, height);
  }

  let DRAWABLE_GFX_TYPE = {
    NONE: 0,
    GFX: 1,
    PATTERN: 2,
    COLOR: 3,
    TEXT: 4,
    VIDEO: 5,
    GAME_STATE: 6,
  };

  ig.GuiDrawable = ig.Class.extend({
    pos: { x: 0, y: 0 },
    size: { x: 0, y: 0 },
    src: { x: 0, y: 0 },
    gfxSource: null,
    gfxType: 0,
    flip: { x: false, y: false },
    alpha: 1,
    compositionMode: 'source-over',

    setPos: function (x, y) {
      this.pos.x = x;
      this.pos.y = y;
      return this;
    },
    setSize: function (x, y) {
      this.size.x = x;
      this.size.y = y;
      return this;
    },
    setSrc: function (x, y) {
      this.src.x = x;
      this.src.y = y;
      return this;
    },

    setAlpha: function (alpha) {
      this.alpha = alpha;
      return this;
    },

    setColor: function (color, posX, posY, sizeX, sizeY) {
      this.gfxSource = color;
      this.gfxType = DRAWABLE_GFX_TYPE.COLOR;
      this.setPos(posX, posY);
      this.setSize(sizeX, sizeY);
      return this;
    },

    setCompositionMode: function (mode) {
      this.compositionMode = mode || 'source-over';
    },

    setGfx: function (gfx, posX, posY, srcX, srcY, sizeX, sizeY, flipX, flipY) {
      if (window.IG_DEBUG && !(gfx instanceof ig.Image || gfx instanceof ig.ImageAtlasFragment))
        throw new Error('Invalid setGfx Call. gfx is not instance of ig.Image');
      this.gfxSource = gfx;
      this.gfxType = DRAWABLE_GFX_TYPE.GFX;
      this.setPos(posX, posY);
      this.setSrc(srcX, srcY);
      this.setSize(sizeX, sizeY);
      this.flip.x = flipX || false;
      this.flip.y = flipY || false;
      return this;
    },
    setGfxTile: function (gfx, posX, posY, tile, tileWidth, tileHeight, flipX, flipY) {
      if (window.IG_DEBUG && !(gfx instanceof ig.Image))
        throw new Error('Invalid setGfxTile Call. gfx is not instance of ig.Image');
      tileHeight = tileHeight ? tileHeight : tileWidth;
      this.setGfx(
        gfx,
        posX,
        posY,
        Math.floor(tile * tileWidth) % gfx.width,
        Math.floor((tile * tileWidth) / gfx.width) * tileHeight,
        tileWidth,
        tileHeight,
        flipX,
        flipY,
      );
      return this;
    },
    setText: function (textblock, posX, posY) {
      if (window.IG_DEBUG && !(textblock instanceof ig.TextBlock))
        throw new Error('Invalid setText Call. gfx is not instance of ig.TextBlock');
      this.gfxSource = textblock;
      this.gfxType = DRAWABLE_GFX_TYPE.TEXT;
      this.setPos(posX, posY);
      return this;
    },
    draw: function (x, y) {
      let system = ig.system,
        context = system.context,
        scale = system.scale;
      let destX = x + this.pos.x,
        destY = y + this.pos.y,
        stateStored = false;
      let preAlpha;
      let preCompMode;
      if (this.alpha !== 1) {
        preAlpha = context.globalAlpha;
        context.globalAlpha *= this.alpha;
      }
      if (this.compositionMode !== 'source-over') {
        preCompMode = context.globalCompositeOperation;
        context.globalCompositeOperation = this.compositionMode;
      }
      if (this.gfxType === DRAWABLE_GFX_TYPE.COLOR) {
        context.fillStyle = this.gfxSource;
        context.fillRect(
          system.getDrawPos(destX),
          system.getDrawPos(destY),
          this.size.x * scale,
          this.size.y * scale,
        );
      } else if (this.gfxType === DRAWABLE_GFX_TYPE.GFX) {
        this.gfxSource.draw(
          destX,
          destY,
          this.src.x,
          this.src.y,
          this.size.x,
          this.size.y,
          this.flip.x,
          this.flip.y,
        );
      } else if (this.gfxType === DRAWABLE_GFX_TYPE.TEXT) {
        this.gfxSource.draw(destX, destY);
        this.gfxSource.update();
      }
      if (context.globalCompositeOperation !== 'source-over') {
        context.globalCompositeOperation = preCompMode;
      }
      if (this.alpha !== 1) {
        context.globalAlpha = preAlpha;
      }
      if (stateStored) {
        context.restore();
      }
    },
    kill: function () {
      this.gfxSource = null;
      this.gfxType = 0;
      c_guiStepPool.free(this);
    },
    clear: function () {
      this.alpha = 1;
      this.src.x = this.src.y = this.size.x = this.size.y = undefined;
      this.flip.x = this.flip.y = false;
      this.compositionMode = 'source-over';
    },
  });

  ig.GuiTransform = ig.Class.extend({
    translate: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotate: 0,
    pivot: { x: 0, y: 0 },
    alpha: 1,
    clip: { x: 0, y: 0 },
    prePos: { x: 0, y: 0 },
    preAlpha: 0,

    setAlpha: function (alpha) {
      this.alpha = alpha;
      return this;
    },

    setClip: function (x, y) {
      this.clip.x = x;
      this.clip.y = y;
      return this;
    },

    setTranslate: function (x, y) {
      this.translate.x = x;
      this.translate.y = y;
      return this;
    },
    setScale: function (x, y) {
      this.scale.x = x;
      this.scale.y = y;
      return this;
    },
    setRotate: function (r) {
      this.rotate = r;
      return this;
    },
    setPivot: function (x, y) {
      this.pivot.x = x;
      this.pivot.y = y;
      return this;
    },

    isComplex: function () {
      return this.scale.x !== 1 || this.scale.y !== 1 || this.rotate || this.clip.x !== 0;
    },
    transform: function (x, y) {
      let system = ig.system,
        context = system.context,
        scale = system.scale;
      context.save();
      this.prePos.x = x;
      this.prePos.y = y;
      context.translate(
        ig.system.getDrawPos(x + this.translate.x),
        ig.system.getDrawPos(y + this.translate.y),
      );
      if (this.clip.x !== 0) {
        context.beginPath();
        context.rect(0, 0, this.clip.x * scale, this.clip.y * scale);
        context.clip();
      }
      if (this.scale.x !== 1 || this.scale.y !== 1 || this.rotate !== 0) {
        context.translate(ig.system.getDrawPos(this.pivot.x), ig.system.getDrawPos(this.pivot.y));
        context.rotate(this.rotate);

        // We avoid 0 scales as this breaks Firefox on Linux
        context.scale(this.scale.x || 0.0001, this.scale.y || 0.0001);
        context.translate(-ig.system.getDrawPos(this.pivot.x), -ig.system.getDrawPos(this.pivot.y));
      }
    },
    kill: function () {
      c_guiStepPool.free(this);
    },
    clear: function () {
      this.translate.x = this.translate.y = 0;
      this.scale.x = this.scale.y = 1;
      this.rotate = 0;
      this.pivot.x = this.pivot.y = 0;
      this.alpha = 1;
      this.clip.x = this.clip.y = 0;
    },
  });

  ig.GuiStepPool = ig.Class.extend({
    get: function (classObj) {
      if (!classObj.poolEntries) classObj.poolEntries = [];
      if (classObj.poolEntries.length) {
        let entry = classObj.poolEntries.pop();
        entry.clear();
        return entry;
      }
      return new classObj();
    },
    free: function (entry) {
      let classObj = entry.constructor;
      if (!classObj.poolEntries) classObj.poolEntries = [];
      classObj.poolEntries.push(entry);
    },
  });
  let c_guiStepPool = new ig.GuiStepPool();

  ig.GuiElementBase = ig.Class.extend({
    hook: null,

    init: function () {
      this.hook = new ig.GuiHook(this);
    },

    setPos: function (x, y) {
      let hook = this.hook;
      hook.pos.x = x || 0;
      hook.pos.y = y || 0;
      hook.posTransition = null;
    },
    getDestPos: function () {
      let hook = this.hook;
      return hook.posTransition || hook.pos;
    },
    setScroll: function (x, y) {
      let hook = this.hook;
      hook.scroll.x = x;
      hook.scroll.y = y;
      hook.scrollTransition = null;
    },
    getDestScroll: function () {
      let hook = this.hook;
      return hook.scrollTransition || hook.scroll;
    },

    setSize: function (x, y) {
      let hook = this.hook;
      hook.size.x = x;
      hook.size.y = y;
    },
    setPivot: function (x, y) {
      let hook = this.hook;
      hook.pivot.x = x;
      hook.pivot.y = y;
    },
    setAlign: function (x, y) {
      let hook = this.hook;
      hook.align.x = x;
      hook.align.y = y;
    },

    isVisible: function () {
      let hook = this.hook;
      return hook._visible;
    },
    getChildGuiIndex: function (gui) {
      return this.hook.getChildGuiIndex(gui.hook);
    },
    getChildGuiByIndex: function (index) {
      return this.hook.getChildGuiByIndex(index);
    },

    addChildGui: function (guiElement) {
      this.hook.addChildHook(guiElement.hook);
    },
    insertChildGui: function (guiElement, index) {
      this.hook.insertChildHook(guiElement.hook, index);
    },
    removeChildGui: function (guiElement) {
      this.hook.removeChildHook(guiElement.hook);
    },
    removeChildGuiByIndex: function (index) {
      return this.hook.removeChildHookByIndex(index).gui;
    },
    removeAllChildren: function () {
      this.hook.removeAllChildren();
    },

    update: function () {},

    updateDrawables: function (renderer) {},

    remove: function (force) {
      if (force) {
        this.hook.onDetach();
        this.hook.removeAfterTransition = false;
      } else {
        this.hook.removeAfterTransition = true;
      }
    },

    onAttach: null,
    onDetach: null,

    onVisibilityChange: null,

    /** if present, will be called instead of rectangle calculation. */
    isMouseOver: null,

    hide: function () {},

    show: function () {},

    doStateTransition: function (name, skipTransition, removeAfter, callback, initDelay) {
      this.hook.doStateTransition(name, skipTransition, removeAfter, callback, initDelay);
    },
    doTempStateTransition: function (
      stateData,
      time,
      keySpline,
      skipTransition,
      removeAfter,
      callback,
      initDelay,
    ) {
      this.hook.doTempStateTransition(
        stateData,
        time,
        keySpline,
        skipTransition,
        removeAfter,
        callback,
        initDelay,
      );
    },

    doPosTranstition: function (x, y, time, timeFunction, initDelay, preserveTime, endCallback) {
      this.hook.doPosTranstition(x, y, time, timeFunction, initDelay, preserveTime, endCallback);
    },

    doScrollTransition: function (x, y, time, timeFunction, endCallback) {
      this.hook.doScrollTransition(x, y, time, timeFunction, endCallback);
    },

    hasTransition: function () {
      return this.hook.hasTransition();
    },
    getTransitionFactor: function () {
      return this.hook.getTransitionFactor();
    },

    setStateValue: function (state, attribute, value) {
      this.hook.setStateValue(state, attribute, value);
    },
  });
});

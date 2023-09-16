ig.module('impact.base.system')
  .requires('impact.base.timer')
  .defines(() => {
    let FRAMES = 0;
    function runInner() {
      FRAMES += 1;
      if (FRAMES % ig.system.frameSkip === 0) {
        ig.Timer.step();
        ig.system.rawTick = ig.system.actualTick =
          Math.min(ig.Timer.maxStep, ig.system.clock.tick()) * ig.system.totalTimeFactor;
        if (ig.system.hasFocusLost()) ig.system.actualTick = 0;
        ig.system.tick = ig.system.actualTick * ig.system.timeFactor;
        if (ig.system.skipMode) {
          ig.system.tick *= 8;
          ig.system.actualTick *= 8;
        }

        ig.system.delegate.run();

        if (ig.system.newDelegateClass) {
          ig.system.setDelegateNow(ig.system.newDelegateClass);
          ig.system.newDelegateClass = null;
        }
      }
      if (ig.system.fps >= 60) {
        window.requestAnimationFrame(ig.system.run.bind(ig.system));
      }
    }

    ig.System = ig.Class.extend({
      fps: 60,
      frameSkip: 1,
      width: 320,
      height: 240,
      contextWidth: 320,
      contextHeight: 240,
      realWidth: 320,
      realHeight: 240,
      screenWidth: 320,
      screenHeight: 240,
      zoomFocus: { x: 0, y: 0 },
      zoom: 1,
      scale: 1,
      contextScale: 1,
      focusLost: false,
      focusListeners: [],
      windowFocusLost: false,
      imageSmoothingKey: null,
      imageSmoothingDisabled: false,
      crashed: false,
      cursorType: null,

      skipMode: false,
      timeFactor: 1,
      totalTimeFactor: 1,
      rawTick: 0, // not influenced at all
      tick: 0, // tick modified by timeFactor
      actualTick: 0, // unmodified tick
      intervalId: 0,
      newDelegateClass: null,
      running: false,

      delegate: null,
      clock: null,
      inputDom: null,
      canvas: null,
      context: null,

      smoothPositioning: true,

      init(canvasId, inputDomId, fps, width, height, scale) {
        this.fps = fps;

        this.clock = new ig.Timer();
        this.canvas = document.querySelector(canvasId);
        this.context = this.canvas.getContext('2d');
        if (this.context.imageSmoothingEnabled) this.imageSmoothingKey = 'imageSmoothingEnabled';
        this.imageSmoothingDisabled = !!this.imageSmoothingKey;

        this.inputDom = inputDomId ? document.querySelector(inputDomId) : document;
        this.resize(width, height, scale);
      },

      resize(width, height, scale = 1) {
        this.width = width;
        this.height = height;
        if (this.imageSmoothingDisabled) {
          this.scale = 1;
          this.contextScale = scale || 1;
        } else {
          this.scale = scale;
          this.contextScale = 1;
        }

        this.contextWidth = this.width * this.scale;
        this.contextHeight = this.height * this.scale;
        this.realWidth = this.width * scale;
        this.realHeight = this.height * scale;
        this.canvas.width = this.realWidth;
        this.canvas.height = this.realHeight;
        this.zoomFocus.x = width / 2;
        this.zoomFocus.y = height / 2;
        this.screenWidth = this.canvas.style.width.replace('px', '') * 1 || this.canvas.width;
        this.screenHeight = this.canvas.style.height.replace('px', '') * 1 || this.canvas.height;

        if (this.imageSmoothingDisabled) {
          this.context[this.imageSmoothingKey] = false;
        }

        if (this.contextScale !== 1) {
          this.context.scale(this.contextScale, this.contextScale);
        }
      },

      setDelegate(clazz) {
        if (this.running) {
          this.newDelegateClass = clazz;
        } else {
          ig.site = new clazz();
          this.setDelegateNow(ig.site);
        }
      },

      setDelegateNow(obj) {
        if (typeof obj.run === 'function') {
          this.delegate = obj;
          this.startRunLoop();
        } else {
          let e = new Error('System.setDelegateNow: No run() function in object');
          ig.system.error(e);
        }
      },

      stopRunLoop() {
        clearInterval(this.intervalId);
        this.running = false;
      },

      startRunLoop() {
        this.stopRunLoop();

        if (this.fps >= 60) {
          window.requestAnimationFrame(this.run.bind(this));
        } else {
          this.intervalId = setInterval(this.run.bind(this), 1000 / this.fps);
        }

        this.running = true;
      },

      clear(colour) {
        this.context.fillStyle = colour;
        this.context.fillRect(0, 0, this.contextWidth, this.contextHeight);
      },

      run() {
        try {
          runInner();
        } catch (e) {
          ig.system.error(e);
        }
      },

      getBufferContext(buffer) {
        let context = buffer.getContext('2d');
        if (this.imageSmoothingDisabled) {
          context[this.imageSmoothingKey] = false;
        }
        return context;
      },

      error(e) {
        // Maybe do some fancy error handling here
        throw e;
      },

      hasFocusLost() {
        return this.focusLost || this.windowFocusLost;
      },

      setWindowFocus(status) {
        this.windowFocusLost = status;
      },

      callFocusListeners() {
        for (let listener of this.focusListeners) {
          listener(this.focusLost);
        }
      },

      setCanvasSize(x, y, hideBorder) {
        this.canvas.style.width = x + 'px';
        this.canvas.style.height = y + 'px';
        this.canvas.className = hideBorder ? 'borderHidden' : '';
        this.screenWidth = x;
        this.screenHeight = y;
      },
      setFocusLost() {
        this.focusLost = true;
      },
      regainFocus() {
        this.focusLost = false;
        this.callFocusListeners();
      },
      addFocusListener(listener) {
        this.focusListeners.push(listener);
      },
      removeFocusListener(listener) {
        this.focusListeners.erase(listener);
      },
    });
  });

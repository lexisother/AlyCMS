ig.module('impact.base.loader')
  .requires('impact.base.timer')
  .defines(() => {
    ig.cacheList = {};

    ig.Cacheable = ig.Class.extend({
      cacheType: null,
      cacheKey: null,
      getCacheKey: null,
      refCount: 0,
      staticInstantiate() {
        if (!this.constructor.cache) {
          this.constructor.cache = {};
          let cacheType = this.constructor.prototype.cacheType;
          if (!cacheType) throw new Error('ig.Cacheable without CacheType!');
          ig.cacheList[cacheType] = this.constructor.cache;
        }

        let key = (this.cacheKey = this.getCacheKey.apply(this, arguments));
        if (key) {
          let instance = this.constructor.cache[key];
          if (instance) {
            instance.increaseRef();
            return instance;
          }
        }
        return null;
      },
      init() {
        this.cacheKey && (this.constructor.cache[this.cacheKey] = this);
        this.increaseRef();
      },
      increaseRef() {
        this.refCount++;
      },
    });

    ig.Loadable = ig.Cacheable.extend({
      loaded: false,
      failed: false,
      path: '',
      tolerateMissingResources: false,
      loadListeners: [],
      loadCollectors: [],
      init(path) {
        this.parent();
        if (typeof path === 'string') {
          this.path = path;
          ig.addResourceToCollectors(this);
          ig.ready ? this.load() : ig.addResource(this);
        } else {
          this.path = '[INLINE DATA]';
          this.loaded = true;
        }
      },
      onInstanceReused() {
        this.loaded || ig.addResourceToCollectors(this);
      },
      getCacheKey(cacheKey) {
        return typeof cacheKey === 'string' ? cacheKey : null;
      },
      load(cb) {
        if (this.loaded) cb(this.cacheType, this.path, true);
        else {
          this.loadCallback = cb || null;
          this.loadInternal(this.path);
        }
      },
      loadingFinished(loaded) {
        loaded ? (this.loaded = true) : (this.failed = true);

        // Load listener management
        if (this.loadListeners.length > 0)
          for (let listener of this.loadListeners) listener.onLoadableComplete(this.loaded, this);
        this.loadListeners.length = 0;
        ig.setResourceLoadedToCollectors(this);

        if (this.loadCallback) {
          this.loadCallback(this.cacheType, this.path, loaded);
          this.loadCallback = null;
        }
      },
      addLoadListener(listener) {
        if (this.loaded) listener.onLoadableComplete(true, this);
        else this.loadListeners.push(listener);
      },
    });

    ig.JsonLoadable = ig.Loadable.extend({
      cacheType: 'JsonFile',
      init: function (a) {
        this.parent(a);
        if (typeof a == 'object') this.onload(a);
      },
      loadInternal: function () {
        $.ajax({
          dataType: 'json',
          url: this.path,
          context: this,
          success: this.onJsonLoaded.bind(this),
          error: this.onJsonError.bind(this),
        });
      },
      onJsonLoaded: function (a) {
        ig.activateCollectors(this);
        this.onload(a);
        ig.removeCollectors(this);
        this.loadingFinished(true);
      },
      onJsonError: function () {
        this.onerror && this.onerror();
        this.loadingFinished(false);
      },
      onload(a) {
        console.log(a);
      },
    });

    ig.Loader = ig.Class.extend({
      resources: [],
      status: 0,
      done: false,
      lastPath: '',

      _unloaded: [],
      _drawStatus: 0,
      _intervalId: 0,
      _loadCallbackBound: null,
      _loadIndex: 0,

      init: function (gameClass) {
        this.gameClass = gameClass || null;
        this.resources = ig.resources;
        this._loadCallbackBound = this._loadCallback.bind(this);

        for (let i = 0; i < this.resources.length; i++) {
          this._unloaded.push(this.resources[i].cacheType + this.resources[i].path);
        }
      },

      load: function () {
        ig.ready = false;
        ig.loading = true;
        //ig.system.clear( '#000' );

        if (!this.resources.length) {
          this.end();
          return;
        }

        this._loadIndex = this.resources.length;
        for (let i = 0; i < this.resources.length; i++) {
          this.loadResource(this.resources[i]);
        }
        this._intervalId = setInterval(this.draw.bind(this), 16);
      },

      loadResource: function (res) {
        res.load(this._loadCallbackBound);
      },

      end: function () {
        if (this.done) {
          return;
        }
        this.done = true;

        this.onEnd();
      },

      onEnd: function () {
        this.finalize();
      },

      finalize: function () {
        ig.resources = [];
        ig.ready = true;
        if (this.gameClass) {
          ig.system.setDelegate(this.gameClass);
        } else {
          ig.site.loadingComplete();
        }
        clearInterval(this._intervalId);
        ig.loading = false;
      },

      draw: function () {
        this._drawStatus += (this.status - this._drawStatus) / 5;
        let s = ig.system.scale;
        let w = ig.system.width * 0.6;
        let h = ig.system.height * 0.1;
        let x = ig.system.width * 0.5 - w / 2;
        let y = ig.system.height * 0.5 - h / 2;

        ig.system.context.fillStyle = '#000';
        ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);

        ig.system.context.fillStyle = '#fff';
        ig.system.context.fillRect(x * s, y * s, w * s, h * s);

        ig.system.context.fillStyle = '#000';
        ig.system.context.fillRect(x * s + s, y * s + s, w * s - s - s, h * s - s - s);

        ig.system.context.fillStyle = '#fff';
        ig.system.context.fillRect(x * s, y * s, w * s * this._drawStatus, h * s);
      },

      _loadCallback: function (type, path, status) {
        let key = type + path;
        this._unloaded.erase(key);

        let lastLoadIndex = this._loadIndex;

        this._loadIndex = this.resources.length;
        for (let i = lastLoadIndex; i < this.resources.length; i++) {
          this._unloaded.push(this.resources[i].cacheType + this.resources[i].path);
        }
        for (let i = lastLoadIndex; i < this.resources.length; i++) {
          this.loadResource(this.resources[i]);
        }

        this.lastPath = path;
        this.status = 1 - this._unloaded.length / this.resources.length;
        if (this._unloaded.length === 0) {
          // all done?
          setTimeout(this.end.bind(this), 250);
        }

        if (!status && !this.tolerateMissingResources) {
          let e = new Error('Failed to load resource: ' + path);
          ig.system.error(e);
        }
      },
    });

    ig.LoadCollector = ig.Class.extend({
      listener: null,
      resources: [],
      init(listener) {
        this.listener = listener;
        ig.loadCollectors.push(this);
      },
      finalizeLoadableFetching() {
        ig.loadCollectors.erase(this);
        this.resources.length === 0 && this.done();
      },
      addResource(res) {
        if (this.resources.indexOf(res) === -1) {
          this.resources.push(res);
          res.loadCollectors.push(this);
        }
      },
      setResourceLoaded(res) {
        this.resources.erase(res);
        this.resources.length === 0 && this.done();
      },
      done() {
        this.listener.onLoadableComplete(true, this);
      },
    });

    ig.loadCollectors = [];
    ig.addResourceToCollectors = (res) => {
      for (let col of ig.loadCollectors) col.addResource(res);
    };
    ig.setResourceLoadedToCollectors = (res) => {
      for (let col of res.loadCollectors) col.setResourceLoaded(res);
      res.loadCollectors.length = 0;
    };
    ig.activateCollectors = (res) => {
      for (let col of res.loadCollectors) ig.loadCollectors.push(col);
    };
    ig.removeCollectors = (res) => {
      for (let col of res.loadCollectors) ig.loadCollectors.erase(col);
    };
  });

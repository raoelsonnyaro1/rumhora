(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/lenis/dist/lenis.mjs
  var version = "1.3.27";
  function clamp(min, input, max) {
    return Math.max(min, Math.min(input, max));
  }
  function lerp(x, y, t) {
    return (1 - t) * x + t * y;
  }
  function damp(x, y, lambda, deltaTime) {
    return lerp(x, y, 1 - Math.exp(-lambda * deltaTime));
  }
  function modulo(n, d) {
    return (n % d + d) % d;
  }
  var Animate = class {
    constructor() {
      __publicField(this, "isRunning", false);
      __publicField(this, "value", 0);
      __publicField(this, "from", 0);
      __publicField(this, "to", 0);
      __publicField(this, "currentTime", 0);
      __publicField(this, "lerp");
      __publicField(this, "duration");
      __publicField(this, "easing");
      __publicField(this, "onUpdate");
    }
    /**
    * Advance the animation by the given delta time
    *
    * @param deltaTime - The time in seconds to advance the animation
    */
    advance(deltaTime) {
      var _a;
      if (!this.isRunning) return;
      let completed = false;
      if (this.duration && this.easing) {
        this.currentTime += deltaTime;
        const linearProgress = clamp(0, this.currentTime / this.duration, 1);
        completed = linearProgress >= 1;
        const easedProgress = completed ? 1 : this.easing(linearProgress);
        this.value = this.from + (this.to - this.from) * easedProgress;
      } else if (this.lerp) {
        this.value = damp(this.value, this.to, this.lerp * 60, deltaTime);
        if (Math.round(this.value) === Math.round(this.to)) {
          this.value = this.to;
          completed = true;
        }
      } else {
        this.value = this.to;
        completed = true;
      }
      if (completed) this.stop();
      (_a = this.onUpdate) == null ? void 0 : _a.call(this, this.value, completed);
    }
    /** Stop the animation */
    stop() {
      this.isRunning = false;
    }
    /**
    * Set up the animation from a starting value to an ending value
    * with optional parameters for lerping, duration, easing, and onUpdate callback
    *
    * @param from - The starting value
    * @param to - The ending value
    * @param options - Options for the animation
    */
    fromTo(from, to, { lerp: lerp2, duration, easing, onStart, onUpdate }) {
      this.from = this.value = from;
      this.to = to;
      this.lerp = lerp2;
      this.duration = duration;
      this.easing = easing;
      this.currentTime = 0;
      this.isRunning = true;
      onStart == null ? void 0 : onStart();
      this.onUpdate = onUpdate;
    }
  };
  function debounce(callback, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = void 0;
        callback.apply(this, args);
      }, delay);
    };
  }
  var Dimensions = class {
    constructor(wrapper, content, { autoResize = true, debounce: debounceValue = 250 } = {}) {
      __publicField(this, "width", 0);
      __publicField(this, "height", 0);
      __publicField(this, "scrollHeight", 0);
      __publicField(this, "scrollWidth", 0);
      __publicField(this, "debouncedResize");
      __publicField(this, "wrapperResizeObserver");
      __publicField(this, "contentResizeObserver");
      __publicField(this, "resize", () => {
        this.onWrapperResize();
        this.onContentResize();
      });
      __publicField(this, "onWrapperResize", () => {
        if (this.wrapper instanceof Window) {
          this.width = window.innerWidth;
          this.height = window.innerHeight;
        } else {
          this.width = this.wrapper.clientWidth;
          this.height = this.wrapper.clientHeight;
        }
      });
      __publicField(this, "onContentResize", () => {
        if (this.wrapper instanceof Window) {
          this.scrollHeight = this.content.scrollHeight;
          this.scrollWidth = this.content.scrollWidth;
        } else {
          this.scrollHeight = this.wrapper.scrollHeight;
          this.scrollWidth = this.wrapper.scrollWidth;
        }
      });
      this.wrapper = wrapper;
      this.content = content;
      if (autoResize) {
        this.debouncedResize = debounce(this.resize, debounceValue);
        if (this.wrapper instanceof Window) window.addEventListener("resize", this.debouncedResize);
        else {
          this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize);
          this.wrapperResizeObserver.observe(this.wrapper);
        }
        this.contentResizeObserver = new ResizeObserver(this.debouncedResize);
        this.contentResizeObserver.observe(this.content);
      }
      this.resize();
    }
    destroy() {
      var _a, _b;
      (_a = this.wrapperResizeObserver) == null ? void 0 : _a.disconnect();
      (_b = this.contentResizeObserver) == null ? void 0 : _b.disconnect();
      if (this.wrapper === window && this.debouncedResize) window.removeEventListener("resize", this.debouncedResize);
    }
    get limit() {
      return {
        x: this.scrollWidth - this.width,
        y: this.scrollHeight - this.height
      };
    }
  };
  var Emitter = class {
    constructor() {
      __publicField(this, "events", {});
    }
    /**
    * Emit an event with the given data
    * @param event Event name
    * @param args Data to pass to the event handlers
    */
    emit(event, ...args) {
      var _a;
      const callbacks = this.events[event] || [];
      for (let i = 0, length = callbacks.length; i < length; i++) (_a = callbacks[i]) == null ? void 0 : _a.call(callbacks, ...args);
    }
    /**
    * Add a callback to the event
    * @param event Event name
    * @param cb Callback function
    * @returns Unsubscribe function
    */
    on(event, cb) {
      if (this.events[event]) this.events[event].push(cb);
      else this.events[event] = [cb];
      return () => {
        var _a;
        this.events[event] = (_a = this.events[event]) == null ? void 0 : _a.filter((i) => cb !== i);
      };
    }
    /**
    * Remove a callback from the event
    * @param event Event name
    * @param callback Callback function
    */
    off(event, callback) {
      var _a;
      this.events[event] = (_a = this.events[event]) == null ? void 0 : _a.filter((i) => callback !== i);
    }
    /**
    * Remove all event listeners and clean up
    */
    destroy() {
      this.events = {};
    }
  };
  var LINE_HEIGHT = 100 / 6;
  var listenerOptions = { passive: false };
  function getDeltaMultiplier(deltaMode, size) {
    if (deltaMode === 1) return LINE_HEIGHT;
    if (deltaMode === 2) return size;
    return 1;
  }
  var VirtualScroll = class {
    constructor(element, options = {
      wheelMultiplier: 1,
      touchMultiplier: 1
    }) {
      __publicField(this, "touchStart", {
        x: 0,
        y: 0
      });
      __publicField(this, "lastDelta", {
        x: 0,
        y: 0
      });
      __publicField(this, "window", {
        width: 0,
        height: 0
      });
      __publicField(this, "emitter", new Emitter());
      /**
      * Event handler for 'touchstart' event
      *
      * @param event Touch event
      */
      __publicField(this, "onTouchStart", (event) => {
        const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
        this.touchStart.x = clientX;
        this.touchStart.y = clientY;
        this.lastDelta = {
          x: 0,
          y: 0
        };
        this.emitter.emit("scroll", {
          deltaX: 0,
          deltaY: 0,
          event
        });
      });
      /** Event handler for 'touchmove' event */
      __publicField(this, "onTouchMove", (event) => {
        const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
        const deltaX = -(clientX - this.touchStart.x) * this.options.touchMultiplier;
        const deltaY = -(clientY - this.touchStart.y) * this.options.touchMultiplier;
        this.touchStart.x = clientX;
        this.touchStart.y = clientY;
        this.lastDelta = {
          x: deltaX,
          y: deltaY
        };
        this.emitter.emit("scroll", {
          deltaX,
          deltaY,
          event
        });
      });
      __publicField(this, "onTouchEnd", (event) => {
        this.emitter.emit("scroll", {
          deltaX: this.lastDelta.x,
          deltaY: this.lastDelta.y,
          event
        });
      });
      /** Event handler for 'wheel' event */
      __publicField(this, "onWheel", (event) => {
        let { deltaX, deltaY, deltaMode } = event;
        const multiplierX = getDeltaMultiplier(deltaMode, this.window.width);
        const multiplierY = getDeltaMultiplier(deltaMode, this.window.height);
        deltaX *= multiplierX;
        deltaY *= multiplierY;
        deltaX *= this.options.wheelMultiplier;
        deltaY *= this.options.wheelMultiplier;
        this.emitter.emit("scroll", {
          deltaX,
          deltaY,
          event
        });
      });
      __publicField(this, "onWindowResize", () => {
        this.window = {
          width: window.innerWidth,
          height: window.innerHeight
        };
      });
      this.element = element;
      this.options = options;
      window.addEventListener("resize", this.onWindowResize);
      this.onWindowResize();
      this.element.addEventListener("wheel", this.onWheel, listenerOptions);
      this.element.addEventListener("touchstart", this.onTouchStart, listenerOptions);
      this.element.addEventListener("touchmove", this.onTouchMove, listenerOptions);
      this.element.addEventListener("touchend", this.onTouchEnd, listenerOptions);
    }
    /**
    * Add an event listener for the given event and callback
    *
    * @param event Event name
    * @param callback Callback function
    */
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    /** Remove all event listeners and clean up */
    destroy() {
      this.emitter.destroy();
      window.removeEventListener("resize", this.onWindowResize);
      this.element.removeEventListener("wheel", this.onWheel, listenerOptions);
      this.element.removeEventListener("touchstart", this.onTouchStart, listenerOptions);
      this.element.removeEventListener("touchmove", this.onTouchMove, listenerOptions);
      this.element.removeEventListener("touchend", this.onTouchEnd, listenerOptions);
    }
  };
  var defaultEasing = (t) => Math.min(1, 1.001 - 2 ** (-10 * t));
  var Lenis = class {
    constructor({ wrapper = window, content = document.documentElement, eventsTarget = wrapper, smoothWheel = true, syncTouch = false, syncTouchLerp = 0.075, touchInertiaExponent = 1.7, duration, easing, lerp: lerp2 = 0.1, infinite = false, orientation = "vertical", gestureOrientation = orientation === "horizontal" ? "both" : "vertical", touchMultiplier = 1, wheelMultiplier = 1, autoResize = true, prevent, virtualScroll, overscroll = true, autoRaf = false, anchors = false, autoToggle = false, allowNestedScroll = false, __experimental__naiveDimensions = false, naiveDimensions = __experimental__naiveDimensions, stopInertiaOnNavigate = false, respectReducedMotion = true } = {}) {
      __publicField(this, "_isScrolling", false);
      __publicField(this, "_isStopped", false);
      __publicField(this, "_isLocked", false);
      __publicField(this, "_preventNextNativeScrollEvent", false);
      __publicField(this, "_resetVelocityTimeout", null);
      __publicField(this, "_rafId", null);
      __publicField(this, "_isDraggingSelection", false);
      __publicField(this, "reducedMotionMediaQuery", window.matchMedia("(prefers-reduced-motion: reduce)"));
      /**
      * Whether or not the user is touching the screen
      */
      __publicField(this, "isTouching");
      /**
      * Whether or not the device is running iOS
      */
      __publicField(this, "isIos");
      /**
      * The time in ms since the lenis instance was created
      */
      __publicField(this, "time", 0);
      /**
      * User data that will be forwarded through the scroll event
      *
      * @example
      * lenis.scrollTo(100, {
      *   userData: {
      *     foo: 'bar'
      *   }
      * })
      */
      __publicField(this, "userData", {});
      /**
      * The last velocity of the scroll
      */
      __publicField(this, "lastVelocity", 0);
      /**
      * The current velocity of the scroll
      */
      __publicField(this, "velocity", 0);
      /**
      * The direction of the scroll
      */
      __publicField(this, "direction", 0);
      /**
      * The options passed to the lenis instance
      */
      __publicField(this, "options");
      /**
      * The target scroll value
      */
      __publicField(this, "targetScroll");
      /**
      * The animated scroll value
      */
      __publicField(this, "animatedScroll");
      __publicField(this, "animate", new Animate());
      __publicField(this, "emitter", new Emitter());
      __publicField(this, "dimensions");
      __publicField(this, "virtualScroll");
      __publicField(this, "onScrollEnd", (e) => {
        if (!(e instanceof CustomEvent)) {
          if (this.isScrolling === "smooth" || this.isScrolling === false) e.stopPropagation();
        }
      });
      __publicField(this, "dispatchScrollendEvent", () => {
        this.options.wrapper.dispatchEvent(new CustomEvent("scrollend", {
          bubbles: this.options.wrapper === window,
          detail: { lenisScrollEnd: true }
        }));
      });
      __publicField(this, "onTransitionEnd", (event) => {
        var _a;
        if (((_a = event.propertyName) == null ? void 0 : _a.includes("overflow")) && event.target === this.rootElement) this.checkOverflow();
      });
      __publicField(this, "onClick", (event) => {
        const linkElementsUrls = event.composedPath().filter((node) => node instanceof HTMLAnchorElement && node.href).map((element) => new URL(element.href));
        const currentUrl = new URL(window.location.href);
        if (this.options.anchors) {
          const anchorElementUrl = linkElementsUrls.find((targetUrl) => currentUrl.host === targetUrl.host && currentUrl.pathname === targetUrl.pathname && targetUrl.hash);
          if (anchorElementUrl) {
            const options = typeof this.options.anchors === "object" && this.options.anchors ? this.options.anchors : void 0;
            const target = decodeURIComponent(anchorElementUrl.hash);
            this.scrollTo(target, options);
            return;
          }
        }
        if (this.options.stopInertiaOnNavigate) {
          if (linkElementsUrls.some((targetUrl) => currentUrl.host === targetUrl.host && currentUrl.pathname !== targetUrl.pathname)) {
            this.reset();
            return;
          }
        }
      });
      __publicField(this, "onPointerDown", (event) => {
        if (event.button === 1) this.reset();
      });
      __publicField(this, "onVirtualScroll", (data) => {
        if (typeof this.options.virtualScroll === "function" && this.options.virtualScroll(data) === false) return;
        const { deltaX, deltaY, event } = data;
        this.emitter.emit("virtual-scroll", {
          deltaX,
          deltaY,
          event
        });
        if (event.ctrlKey) return;
        if (event.lenisStopPropagation) return;
        const isTouch = event.type.includes("touch");
        const isWheel = event.type.includes("wheel");
        if (isTouch && this.isIos) {
          if (event.type === "touchstart") this._isDraggingSelection = this.isTouchOnSelectionHandle(event);
          if (this._isDraggingSelection) {
            if (event.type === "touchend") this._isDraggingSelection = false;
            return;
          }
        }
        this.isTouching = event.type === "touchstart" || event.type === "touchmove";
        const isClickOrTap = deltaX === 0 && deltaY === 0;
        if (this.options.syncTouch && isTouch && event.type === "touchstart" && isClickOrTap && !this.isStopped && !this.isLocked) {
          this.reset();
          return;
        }
        const isUnknownGesture = this.options.gestureOrientation === "vertical" && deltaY === 0 || this.options.gestureOrientation === "horizontal" && deltaX === 0;
        if (isClickOrTap || isUnknownGesture) return;
        let composedPath = event.composedPath();
        composedPath = composedPath.slice(0, composedPath.indexOf(this.rootElement));
        const prevent = this.options.prevent;
        const gestureOrientation = Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
        if (composedPath.find((node) => {
          var _a, _b, _c, _d, _e;
          return node instanceof HTMLElement && (typeof prevent === "function" && (prevent == null ? void 0 : prevent(node)) || ((_a = node.hasAttribute) == null ? void 0 : _a.call(node, "data-lenis-prevent")) || gestureOrientation === "vertical" && ((_b = node.hasAttribute) == null ? void 0 : _b.call(node, "data-lenis-prevent-vertical")) || gestureOrientation === "horizontal" && ((_c = node.hasAttribute) == null ? void 0 : _c.call(node, "data-lenis-prevent-horizontal")) || isTouch && ((_d = node.hasAttribute) == null ? void 0 : _d.call(node, "data-lenis-prevent-touch")) || isWheel && ((_e = node.hasAttribute) == null ? void 0 : _e.call(node, "data-lenis-prevent-wheel")) || this.options.allowNestedScroll && this.hasNestedScroll(node, {
            deltaX,
            deltaY
          }));
        })) return;
        if (this.isStopped || this.isLocked) {
          if (event.cancelable) event.preventDefault();
          return;
        }
        if (!(this.options.syncTouch && isTouch || this.options.smoothWheel && isWheel)) {
          this.isScrolling = "native";
          this.animate.stop();
          event.lenisStopPropagation = true;
          return;
        }
        let delta = deltaY;
        if (this.options.gestureOrientation === "both") delta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX;
        else if (this.options.gestureOrientation === "horizontal") delta = deltaX;
        if (!this.options.overscroll || this.options.infinite || this.options.wrapper !== window && this.limit > 0 && (this.animatedScroll > 0 && this.animatedScroll < this.limit || this.animatedScroll === 0 && deltaY > 0 || this.animatedScroll === this.limit && deltaY < 0)) event.lenisStopPropagation = true;
        if (event.cancelable) event.preventDefault();
        const isSyncTouch = isTouch && this.options.syncTouch;
        const hasTouchInertia = isTouch && event.type === "touchend";
        if (hasTouchInertia) delta = Math.sign(delta) * Math.abs(this.velocity) ** this.options.touchInertiaExponent;
        this.scrollTo(this.targetScroll + delta, __spreadValues({
          programmatic: false
        }, isSyncTouch ? { lerp: hasTouchInertia ? this.options.syncTouchLerp : 1 } : {
          lerp: this.options.lerp,
          duration: this.options.duration,
          easing: this.options.easing
        }));
      });
      __publicField(this, "onNativeScroll", () => {
        if (this._resetVelocityTimeout !== null) {
          clearTimeout(this._resetVelocityTimeout);
          this._resetVelocityTimeout = null;
        }
        if (this._preventNextNativeScrollEvent) {
          this._preventNextNativeScrollEvent = false;
          return;
        }
        if (this.isScrolling === false || this.isScrolling === "native") {
          const lastScroll = this.animatedScroll;
          this.animatedScroll = this.targetScroll = this.actualScroll;
          this.lastVelocity = this.velocity;
          this.velocity = this.animatedScroll - lastScroll;
          this.direction = Math.sign(this.animatedScroll - lastScroll);
          if (!this.isStopped) this.isScrolling = "native";
          this.emit();
          if (this.velocity !== 0) this._resetVelocityTimeout = setTimeout(() => {
            this.lastVelocity = this.velocity;
            this.velocity = 0;
            this.isScrolling = false;
            this.emit();
          }, 400);
        }
      });
      /**
      * RequestAnimationFrame for lenis
      *
      * @param time The time in ms from an external clock like `requestAnimationFrame` or Tempus
      */
      __publicField(this, "raf", (time) => {
        const deltaTime = time - (this.time || time);
        this.time = time;
        this.animate.advance(deltaTime * 1e-3);
        if (this.options.autoRaf) this._rafId = requestAnimationFrame(this.raf);
      });
      window.lenisVersion = version;
      if (!window.lenis) window.lenis = {};
      window.lenis.version = version;
      if (orientation === "horizontal") window.lenis.horizontal = true;
      if (syncTouch === true) window.lenis.touch = true;
      this.isIos = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
      if (!wrapper || wrapper === document.documentElement) wrapper = window;
      if (typeof duration === "number" && typeof easing !== "function") easing = defaultEasing;
      else if (typeof easing === "function" && typeof duration !== "number") duration = 1;
      this.options = {
        wrapper,
        content,
        eventsTarget,
        smoothWheel,
        syncTouch,
        syncTouchLerp,
        touchInertiaExponent,
        duration,
        easing,
        lerp: lerp2,
        infinite,
        gestureOrientation,
        orientation,
        touchMultiplier,
        wheelMultiplier,
        autoResize,
        prevent,
        virtualScroll,
        overscroll,
        autoRaf,
        anchors,
        autoToggle,
        allowNestedScroll,
        naiveDimensions,
        stopInertiaOnNavigate,
        respectReducedMotion
      };
      this.dimensions = new Dimensions(wrapper, content, { autoResize });
      this.updateClassName();
      this.targetScroll = this.animatedScroll = this.actualScroll;
      this.options.wrapper.addEventListener("scroll", this.onNativeScroll);
      this.options.wrapper.addEventListener("scrollend", this.onScrollEnd, { capture: true });
      if (this.options.anchors || this.options.stopInertiaOnNavigate) this.options.wrapper.addEventListener("click", this.onClick);
      this.options.wrapper.addEventListener("pointerdown", this.onPointerDown);
      this.virtualScroll = new VirtualScroll(eventsTarget, {
        touchMultiplier,
        wheelMultiplier
      });
      this.virtualScroll.on("scroll", this.onVirtualScroll);
      if (this.options.autoToggle) {
        this.checkOverflow();
        this.rootElement.addEventListener("transitionend", this.onTransitionEnd);
      }
      if (this.options.autoRaf) this._rafId = requestAnimationFrame(this.raf);
    }
    /**
    * Destroy the lenis instance, remove all event listeners and clean up the class name
    */
    destroy() {
      this.emitter.destroy();
      if (this._resetVelocityTimeout !== null) {
        clearTimeout(this._resetVelocityTimeout);
        this._resetVelocityTimeout = null;
      }
      this.options.wrapper.removeEventListener("scroll", this.onNativeScroll);
      this.options.wrapper.removeEventListener("scrollend", this.onScrollEnd, { capture: true });
      this.options.wrapper.removeEventListener("pointerdown", this.onPointerDown);
      if (this.options.anchors || this.options.stopInertiaOnNavigate) this.options.wrapper.removeEventListener("click", this.onClick);
      this.virtualScroll.destroy();
      this.dimensions.destroy();
      this.cleanUpClassName();
      if (this._rafId) cancelAnimationFrame(this._rafId);
    }
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    off(event, callback) {
      return this.emitter.off(event, callback);
    }
    get overflow() {
      const property = this.isHorizontal ? "overflow-x" : "overflow-y";
      return getComputedStyle(this.rootElement)[property];
    }
    checkOverflow() {
      if (["hidden", "clip"].includes(this.overflow)) this.internalStop();
      else this.internalStart();
    }
    setScroll(scroll) {
      if (this.isHorizontal) this.options.wrapper.scrollTo({
        left: scroll,
        behavior: "instant"
      });
      else this.options.wrapper.scrollTo({
        top: scroll,
        behavior: "instant"
      });
    }
    isTouchOnSelectionHandle(event) {
      var _a;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;
      const touch = (_a = event.targetTouches[0]) != null ? _a : event.changedTouches[0];
      if (!touch) return false;
      const rects = selection.getRangeAt(0).getClientRects();
      if (rects.length === 0) return false;
      const first = rects[0];
      const last = rects[rects.length - 1];
      const HANDLE_RADIUS = 40;
      const nearStart = Math.hypot(touch.clientX - first.left, touch.clientY - first.top) <= HANDLE_RADIUS;
      const nearEnd = Math.hypot(touch.clientX - last.right, touch.clientY - last.bottom) <= HANDLE_RADIUS;
      return nearStart || nearEnd;
    }
    /**
    * Force lenis to recalculate the dimensions
    */
    resize() {
      this.dimensions.resize();
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.emit();
    }
    emit() {
      this.emitter.emit("scroll", this);
    }
    reset() {
      this.isLocked = false;
      this.isScrolling = false;
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.lastVelocity = this.velocity = 0;
      this.animate.stop();
    }
    /**
    * Start lenis scroll after it has been stopped
    */
    start() {
      if (!this.isStopped) return;
      if (this.options.autoToggle) {
        this.rootElement.style.removeProperty("overflow");
        return;
      }
      this.internalStart();
    }
    internalStart() {
      if (!this.isStopped) return;
      this.reset();
      this.isStopped = false;
      this.emit();
    }
    /**
    * Stop lenis scroll
    */
    stop() {
      if (this.isStopped) return;
      if (this.options.autoToggle) {
        this.rootElement.style.setProperty("overflow", "clip");
        return;
      }
      this.internalStop();
    }
    internalStop() {
      if (this.isStopped) return;
      this.reset();
      this.isStopped = true;
      this.emit();
    }
    /**
    * Scroll to a target value
    *
    * @param target The target value to scroll to
    * @param options The options for the scroll
    *
    * @example
    * lenis.scrollTo(100, {
    *   offset: 100,
    *   duration: 1,
    *   easing: (t) => 1 - Math.cos((t * Math.PI) / 2),
    *   lerp: 0.1,
    *   onStart: () => {
    *     console.log('onStart')
    *   },
    *   onComplete: () => {
    *     console.log('onComplete')
    *   },
    * })
    */
    scrollTo(_target, { offset = 0, immediate = false, lock = false, programmatic = true, lerp: lerp2 = programmatic ? this.options.lerp : void 0, duration = programmatic ? this.options.duration : void 0, easing = programmatic ? this.options.easing : void 0, onStart, onComplete, force = false, userData } = {}) {
      if (this.prefersReducedMotion) if (programmatic) immediate = true;
      else {
        lerp2 = 1;
        duration = void 0;
        easing = void 0;
      }
      if ((this.isStopped || this.isLocked) && !force) return;
      let target = _target;
      let adjustedOffset = offset;
      if (typeof target === "string" && [
        "top",
        "left",
        "start",
        "#"
      ].includes(target)) target = 0;
      else if (typeof target === "string" && [
        "bottom",
        "right",
        "end"
      ].includes(target)) target = this.limit;
      else {
        let node = null;
        if (typeof target === "string") {
          node = target.startsWith("#") ? document.getElementById(target.slice(1)) : document.querySelector(target);
          if (!node) if (target === "#top") target = 0;
          else console.warn("Lenis: Target not found", target);
        } else if (target instanceof Element) node = target;
        if (node) {
          if (this.options.wrapper !== window) {
            const wrapperRect = this.rootElement.getBoundingClientRect();
            adjustedOffset -= this.isHorizontal ? wrapperRect.left : wrapperRect.top;
          }
          const rect = node.getBoundingClientRect();
          const targetStyle = getComputedStyle(node);
          const scrollMargin = this.isHorizontal ? Number.parseFloat(targetStyle.scrollMarginLeft) : Number.parseFloat(targetStyle.scrollMarginTop);
          const containerStyle = getComputedStyle(this.rootElement);
          const scrollPadding = this.isHorizontal ? Number.parseFloat(containerStyle.scrollPaddingLeft) : Number.parseFloat(containerStyle.scrollPaddingTop);
          target = (this.isHorizontal ? rect.left : rect.top) + this.animatedScroll - (Number.isNaN(scrollMargin) ? 0 : scrollMargin) - (Number.isNaN(scrollPadding) ? 0 : scrollPadding);
        }
      }
      if (typeof target !== "number") return;
      target += adjustedOffset;
      if (this.options.infinite) {
        if (programmatic) {
          this.targetScroll = this.animatedScroll = this.scroll;
          const distance = target - this.animatedScroll;
          if (distance > this.limit / 2) target -= this.limit;
          else if (distance < -this.limit / 2) target += this.limit;
        }
      } else target = clamp(0, target, this.limit);
      if (target === this.targetScroll) {
        onStart == null ? void 0 : onStart(this);
        onComplete == null ? void 0 : onComplete(this);
        return;
      }
      this.userData = userData != null ? userData : {};
      if (immediate) {
        this.animatedScroll = this.targetScroll = target;
        this.setScroll(this.scroll);
        this.reset();
        this.preventNextNativeScrollEvent();
        this.emit();
        onComplete == null ? void 0 : onComplete(this);
        this.userData = {};
        requestAnimationFrame(() => {
          this.dispatchScrollendEvent();
        });
        return;
      }
      if (!programmatic) this.targetScroll = target;
      if (typeof duration === "number" && typeof easing !== "function") easing = defaultEasing;
      else if (typeof easing === "function" && typeof duration !== "number") duration = 1;
      this.animate.fromTo(this.animatedScroll, target, {
        duration,
        easing,
        lerp: lerp2,
        onStart: () => {
          if (lock) this.isLocked = true;
          this.isScrolling = "smooth";
          onStart == null ? void 0 : onStart(this);
        },
        onUpdate: (value, completed) => {
          this.isScrolling = "smooth";
          this.lastVelocity = this.velocity;
          this.velocity = value - this.animatedScroll;
          this.direction = Math.sign(this.velocity);
          this.animatedScroll = value;
          this.setScroll(this.scroll);
          if (programmatic) this.targetScroll = value;
          if (!completed) this.emit();
          if (completed) {
            this.reset();
            this.emit();
            onComplete == null ? void 0 : onComplete(this);
            this.userData = {};
            requestAnimationFrame(() => {
              this.dispatchScrollendEvent();
            });
            this.preventNextNativeScrollEvent();
          }
        }
      });
    }
    preventNextNativeScrollEvent() {
      this._preventNextNativeScrollEvent = true;
      requestAnimationFrame(() => {
        this._preventNextNativeScrollEvent = false;
      });
    }
    hasNestedScroll(node, { deltaX, deltaY }) {
      var _a;
      const time = Date.now();
      if (!node._lenis) node._lenis = {};
      const cache = node._lenis;
      let hasOverflowX;
      let hasOverflowY;
      let isScrollableX;
      let isScrollableY;
      let hasOverscrollBehaviorX;
      let hasOverscrollBehaviorY;
      let scrollWidth;
      let scrollHeight;
      let clientWidth;
      let clientHeight;
      if (time - ((_a = cache.time) != null ? _a : 0) > 2e3) {
        cache.time = Date.now();
        const computedStyle = window.getComputedStyle(node);
        cache.computedStyle = computedStyle;
        hasOverflowX = [
          "auto",
          "overlay",
          "scroll"
        ].includes(computedStyle.overflowX);
        hasOverflowY = [
          "auto",
          "overlay",
          "scroll"
        ].includes(computedStyle.overflowY);
        hasOverscrollBehaviorX = ["auto"].includes(computedStyle.overscrollBehaviorX);
        hasOverscrollBehaviorY = ["auto"].includes(computedStyle.overscrollBehaviorY);
        cache.hasOverflowX = hasOverflowX;
        cache.hasOverflowY = hasOverflowY;
        if (!(hasOverflowX || hasOverflowY)) return false;
        scrollWidth = node.scrollWidth;
        scrollHeight = node.scrollHeight;
        clientWidth = node.clientWidth;
        clientHeight = node.clientHeight;
        isScrollableX = scrollWidth > clientWidth;
        isScrollableY = scrollHeight > clientHeight;
        cache.isScrollableX = isScrollableX;
        cache.isScrollableY = isScrollableY;
        cache.scrollWidth = scrollWidth;
        cache.scrollHeight = scrollHeight;
        cache.clientWidth = clientWidth;
        cache.clientHeight = clientHeight;
        cache.hasOverscrollBehaviorX = hasOverscrollBehaviorX;
        cache.hasOverscrollBehaviorY = hasOverscrollBehaviorY;
      } else {
        isScrollableX = cache.isScrollableX;
        isScrollableY = cache.isScrollableY;
        hasOverflowX = cache.hasOverflowX;
        hasOverflowY = cache.hasOverflowY;
        scrollWidth = cache.scrollWidth;
        scrollHeight = cache.scrollHeight;
        clientWidth = cache.clientWidth;
        clientHeight = cache.clientHeight;
        hasOverscrollBehaviorX = cache.hasOverscrollBehaviorX;
        hasOverscrollBehaviorY = cache.hasOverscrollBehaviorY;
      }
      if (!(hasOverflowX && isScrollableX || hasOverflowY && isScrollableY)) return false;
      const orientation = Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
      let scroll;
      let maxScroll;
      let delta;
      let hasOverflow;
      let isScrollable;
      let hasOverscrollBehavior;
      if (orientation === "horizontal") {
        scroll = Math.round(node.scrollLeft);
        maxScroll = scrollWidth - clientWidth;
        delta = deltaX;
        hasOverflow = hasOverflowX;
        isScrollable = isScrollableX;
        hasOverscrollBehavior = hasOverscrollBehaviorX;
      } else if (orientation === "vertical") {
        scroll = Math.round(node.scrollTop);
        maxScroll = scrollHeight - clientHeight;
        delta = deltaY;
        hasOverflow = hasOverflowY;
        isScrollable = isScrollableY;
        hasOverscrollBehavior = hasOverscrollBehaviorY;
      } else return false;
      if (!hasOverscrollBehavior && (scroll >= maxScroll || scroll <= 0)) return true;
      return (delta > 0 ? scroll < maxScroll : scroll > 0) && hasOverflow && isScrollable;
    }
    /**
    * The root element on which lenis is instanced
    */
    get rootElement() {
      return this.options.wrapper === window ? document.documentElement : this.options.wrapper;
    }
    /**
    * The limit which is the maximum scroll value
    */
    get limit() {
      if (this.options.naiveDimensions) {
        if (this.isHorizontal) return this.rootElement.scrollWidth - this.rootElement.clientWidth;
        return this.rootElement.scrollHeight - this.rootElement.clientHeight;
      }
      return this.dimensions.limit[this.isHorizontal ? "x" : "y"];
    }
    /**
    * Whether or not the scroll is horizontal
    */
    get isHorizontal() {
      return this.options.orientation === "horizontal";
    }
    /**
    * The actual scroll value
    */
    get actualScroll() {
      var _a, _b;
      const wrapper = this.options.wrapper;
      return this.isHorizontal ? (_a = wrapper.scrollX) != null ? _a : wrapper.scrollLeft : (_b = wrapper.scrollY) != null ? _b : wrapper.scrollTop;
    }
    /**
    * The current scroll value
    */
    get scroll() {
      return this.options.infinite ? modulo(this.animatedScroll, this.limit) : this.animatedScroll;
    }
    /**
    * The progress of the scroll relative to the limit
    */
    get progress() {
      return this.limit === 0 ? 1 : this.scroll / this.limit;
    }
    /**
    * Current scroll state
    */
    get isScrolling() {
      return this._isScrolling;
    }
    set isScrolling(value) {
      if (this._isScrolling !== value) {
        this._isScrolling = value;
        this.updateClassName();
      }
    }
    /**
    * Check if lenis is stopped
    */
    get isStopped() {
      return this._isStopped;
    }
    set isStopped(value) {
      if (this._isStopped !== value) {
        this._isStopped = value;
        this.updateClassName();
      }
    }
    /**
    * Check if lenis is locked
    */
    get isLocked() {
      return this._isLocked;
    }
    set isLocked(value) {
      if (this._isLocked !== value) {
        this._isLocked = value;
        this.updateClassName();
      }
    }
    /**
    * Check if lenis is smooth scrolling
    */
    get isSmooth() {
      return this.isScrolling === "smooth";
    }
    /**
    * Whether the user prefers reduced motion and lenis is honoring it (see `respectReducedMotion` option)
    */
    get prefersReducedMotion() {
      return this.options.respectReducedMotion && this.reducedMotionMediaQuery.matches;
    }
    /**
    * The class name applied to the wrapper element
    */
    get className() {
      let className = "lenis";
      if (this.options.autoToggle) className += " lenis-autoToggle";
      if (this.isStopped) className += " lenis-stopped";
      if (this.isLocked) className += " lenis-locked";
      if (this.isScrolling) className += " lenis-scrolling";
      if (this.isScrolling === "smooth") className += " lenis-smooth";
      return className;
    }
    updateClassName() {
      this.cleanUpClassName();
      this.className.split(" ").forEach((className) => {
        this.rootElement.classList.add(className);
      });
    }
    cleanUpClassName() {
      for (const className of Array.from(this.rootElement.classList)) if (className === "lenis" || className.startsWith("lenis-")) this.rootElement.classList.remove(className);
    }
  };

  // src/js/lenis.js
  var lenis;
  function initLenis() {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false
    });
    lenis.scrollTo(0, { immediate: true });
    const { gsap: gsap5, ScrollTrigger: ScrollTrigger5 } = window;
    if (gsap5 && ScrollTrigger5) {
      lenis.on("scroll", ScrollTrigger5.update);
      gsap5.ticker.add((time) => {
        lenis.raf(time * 1e3);
      });
      gsap5.ticker.lagSmoothing(0);
    }
    return lenis;
  }
  function getLenis() {
    return lenis;
  }
  function scrollToTop() {
    if (lenis) {
      lenis.scrollTo(0, {
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      });
    }
  }
  function initScrollToTop() {
    const scrollToTopBtn = document.querySelector(".scroll-to-top");
    if (scrollToTopBtn && lenis) {
      const newBtn = scrollToTopBtn.cloneNode(true);
      scrollToTopBtn.parentNode.replaceChild(newBtn, scrollToTopBtn);
      newBtn.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToTop();
      });
    }
  }

  // src/js/animations.js
  var { gsap, ScrollTrigger, SplitText } = window;
  function queryVisible(selector) {
    return Array.from(document.querySelectorAll(selector)).find((el) => el.offsetParent !== null) || null;
  }
  function untransformedDocTop(el) {
    let top = 0;
    let node = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent;
    }
    return top;
  }
  function whenImagesReady(images, callback) {
    const imgs = images.filter(Boolean);
    const isReady = (img) => img.classList.contains("lazyloaded") || img.complete && img.currentSrc;
    let remaining = imgs.filter((img) => !isReady(img)).length;
    if (remaining === 0) {
      callback();
      return;
    }
    let finished = false;
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      callback();
    }, 5e3);
    const done = () => {
      remaining -= 1;
      if (remaining <= 0 && !finished) {
        finished = true;
        clearTimeout(timeout);
        callback();
      }
    };
    imgs.forEach((img) => {
      if (isReady(img)) return;
      img.addEventListener("lazyloaded", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }
  function mediaRevealImage(image, tl, duration, position, opts = {}) {
    const { fade = true, fromY = 30 } = opts;
    gsap.set(image, { willChange: fade ? "transform, opacity" : "transform" });
    const fromVars = { yPercent: fromY };
    const toVars = {
      yPercent: 0,
      duration,
      ease: "power2.out",
      // Signale la fin du reveal (voir initColumnParallax, qui n'active le
      // parallax qu'une fois cet évènement reçu, et initTextRevealAnimations
      // pour un titre en overlay sur la photo).
      onComplete: () => image.dispatchEvent(new Event("revealcomplete"))
    };
    if (fade) {
      fromVars.opacity = 0;
      toVars.opacity = 1;
    }
    tl.fromTo(image, fromVars, toVars, position);
  }
  function layeredMaskRevealRight(container, tl, duration, position) {
    const overlay = document.createElement("div");
    overlay.className = "media-reveal-overlay";
    overlay.innerHTML = "<div></div><div></div><div></div>";
    container.appendChild(overlay);
    const layers = Array.from(overlay.querySelectorAll("div")).reverse();
    const start = typeof position === "number" ? position : 0;
    const offsets = [0, 0.18, 0.4];
    layers.forEach((layer, i) => {
      tl.to(layer, {
        xPercent: 100,
        duration,
        ease: "power3.inOut",
        onComplete: i === layers.length - 1 ? () => overlay.remove() : void 0
      }, start + offsets[i]);
    });
  }
  function safeInit(fn) {
    try {
      fn();
      return false;
    } catch (error) {
      reportScrollTriggerCorruption(fn.name || "anonymous", error);
      return true;
    }
  }
  var scrollTriggerCorrupted = false;
  function reportScrollTriggerCorruption(context, error) {
    console.error(`Error in ${context}:`, error);
    scrollTriggerCorrupted = true;
  }
  var SPLIT_BY_CHARS_MAX = 120;
  var REVEAL_FROM = { opacity: 0, y: 10, filter: "blur(10px)", willChange: "filter, transform, opacity" };
  function splitForReveal(el) {
    const byWords = (el.textContent || "").trim().length > SPLIT_BY_CHARS_MAX;
    const split = new SplitText(el, {
      type: byWords ? "words" : "words,chars",
      aria: "auto"
    });
    return { split, targets: byWords ? split.words : split.chars };
  }
  function revealSplitTargets(targets, vars = {}) {
    return gsap.to(targets, __spreadValues({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "power2.out",
      stagger: { each: 0.03, from: "random" },
      // clearProps une fois fini : sans ça chaque fragment conserve un `filter`
      // et un `will-change` inline, donc sa propre couche de composition, pour
      // toute la durée de vie de la page. Sur une page à plusieurs titres, ça
      // s'accumule jusqu'à peser sur le scroll.
      onComplete: () => gsap.set(targets, { clearProps: "filter,transform,opacity,willChange" })
    }, vars));
  }
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  var ANIMATION_INITS = [
    initGalerieReveal,
    initVideoReveal,
    initGalerieThumbReveal,
    initGalerieSwipers,
    initCarousels,
    initEventCarousels,
    initFadeInAnimations,
    initGsapFadeIn,
    initTextRevealAnimations,
    initListRevealAnimations,
    initTextScrubReveal,
    initStaggerReveal,
    initFaqAccordion,
    initCardHoverAnimations,
    initRevealImages,
    initLineReveal,
    initColumnParallax,
    initFooterMenuReveal,
    initSlideUp,
    initButtonReveal,
    initScrollDownButton,
    initAnchorScroll
  ];
  async function runAnimationInitsPass() {
    let hadCrash = false;
    const chunkSize = 3;
    for (let i = 0; i < ANIMATION_INITS.length; i += chunkSize) {
      ANIMATION_INITS.slice(i, i + chunkSize).forEach((fn) => {
        if (safeInit(fn)) hadCrash = true;
      });
      if (i + chunkSize < ANIMATION_INITS.length) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    }
    if (safeInit(() => ScrollTrigger.refresh())) hadCrash = true;
    return hadCrash;
  }
  function hardResetScrollTrigger() {
    ScrollTrigger.getAll().slice().forEach((trigger) => trigger.kill(true));
    document.querySelectorAll(".pin-spacer").forEach((spacer) => {
      const pinned = spacer.firstElementChild;
      if (pinned && spacer.parentNode) {
        spacer.parentNode.insertBefore(pinned, spacer);
      }
      spacer.remove();
    });
  }
  function createAnimations(curtainPromise) {
    document.querySelectorAll(".text-reveal, h1, h2, h3").forEach((el) => {
      if (!el.closest(".section_hero")) {
        gsap.set(el, { autoAlpha: 0 });
      }
    });
    document.querySelectorAll(".list-reveal").forEach((el) => {
      if (!el.closest(".section_hero")) {
        gsap.set(el, { autoAlpha: 0 });
      }
    });
    const startRest = async () => {
      scrollTriggerCorrupted = false;
      const hadCrash = await runAnimationInitsPass();
      if (hadCrash) {
        console.warn("[ScrollTrigger] Corruption d\xE9tect\xE9e pendant la cr\xE9ation des animations \u2014 reset complet et nouvelle tentative.");
        scrollTriggerCorrupted = false;
        hardResetScrollTrigger();
        await runAnimationInitsPass();
      }
      setTimeout(() => {
        if (scrollTriggerCorrupted) {
          console.warn("[ScrollTrigger] Corruption d\xE9tect\xE9e apr\xE8s coup \u2014 reset complet et nouvelle tentative.");
          scrollTriggerCorrupted = false;
          hardResetScrollTrigger();
          runAnimationInitsPass();
        }
      }, 2500);
    };
    if (safeInit(() => initHeroIntro(startRest, curtainPromise))) {
      startRest();
    }
  }
  function killAnimations() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    ScrollTrigger.getAll().slice().forEach((trigger) => trigger.kill(true));
    destroyColumnParallax();
  }
  function initAnimations(curtainPromise) {
    if (typeof gsap === "undefined") {
      console.warn("\u26A0\uFE0F GSAP not available");
      return;
    }
    createAnimations(curtainPromise);
  }
  function initRevealImages() {
    document.querySelectorAll(".reveal").forEach((container) => {
      if (container.offsetParent === null) return;
      const image = container.querySelector("img");
      if (!image) return;
      try {
        const tl = gsap.timeline({
          delay: parseFloat(container.dataset.revealDelay) || 0,
          scrollTrigger: {
            trigger: container,
            // Fonction plutôt que 'top 80%' : voir untransformedDocTop — le
            // .from(container, {yPercent:100}) juste en dessous fausserait
            // sinon la mesure.
            start: () => {
              const percent = parseFloat(container.dataset.revealStart) || 80;
              return untransformedDocTop(container) - percent / 100 * window.innerHeight;
            },
            once: true
          }
        });
        tl.set(container, { autoAlpha: 1 }).from(container, {
          yPercent: 100,
          duration: 1.5,
          ease: "power2.out"
        }, 0);
        mediaRevealImage(image, tl, 1.5, 0);
        if (container.dataset.revealMask === "right") {
          layeredMaskRevealRight(container, tl, 0.9, 0.5);
        }
        if (container.dataset.revealCompanion) {
          const companions = document.querySelectorAll(container.dataset.revealCompanion);
          if (companions.length) {
            gsap.set(companions, { autoAlpha: 0 });
            tl.to(companions, {
              autoAlpha: 1,
              duration: 0.5,
              ease: "power1.out"
            });
          }
        }
      } catch (error) {
        reportScrollTriggerCorruption("initRevealImages (container)", error);
        gsap.set(container, { autoAlpha: 1 });
        if (container.dataset.revealCompanion) {
          gsap.set(document.querySelectorAll(container.dataset.revealCompanion), { autoAlpha: 1 });
        }
      }
    });
  }
  function initLineReveal() {
    document.querySelectorAll(".line-reveal").forEach((line) => {
      if (line.offsetParent === null) return;
      try {
        gsap.timeline({
          delay: parseFloat(line.dataset.revealDelay) || 0,
          scrollTrigger: {
            trigger: line,
            start: () => {
              const percent = parseFloat(line.dataset.revealStart) || 80;
              return untransformedDocTop(line) - percent / 100 * window.innerHeight;
            },
            once: true
          }
        }).to(line, {
          scaleX: 1,
          duration: 0.5,
          ease: "power2.out"
        }, 0);
      } catch (error) {
        reportScrollTriggerCorruption("initLineReveal (line)", error);
        gsap.set(line, { scaleX: 1 });
      }
    });
  }
  function initTextRevealAnimations() {
    if (typeof SplitText === "undefined") return;
    gsap.registerPlugin(SplitText);
    const textRevealElements = Array.from(document.querySelectorAll(".text-reveal, h1, h2, h3")).filter((el) => !el.closest(".section_hero"));
    if (!textRevealElements.length) return;
    if (prefersReducedMotion()) {
      gsap.set(textRevealElements, { autoAlpha: 1 });
      document.dispatchEvent(new CustomEvent("textRevealStarted"));
      return;
    }
    const fontLoads = textRevealElements.map((el) => {
      const cs = getComputedStyle(el);
      return document.fonts.load(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`).catch(() => {
      });
    });
    Promise.all(fontLoads).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          let hadElementError = false;
          let doneCount = 0;
          const notifyProgress = () => {
            doneCount += 1;
            if (doneCount >= textRevealElements.length) {
              document.dispatchEvent(new CustomEvent("textRevealStarted"));
            }
          };
          textRevealElements.forEach((el) => {
            try {
              if (el._splitText) {
                el._splitText.revert();
              }
              el.offsetHeight;
              const { split, targets } = splitForReveal(el);
              el._splitText = split;
              gsap.set(el, { autoAlpha: 1 });
              gsap.set(targets, REVEAL_FROM);
              const titleOverlay = el.closest(".cta-title-overlay");
              if (titleOverlay) {
                const photoImg = titleOverlay.parentElement.querySelector(".reveal img");
                const anim = revealSplitTargets(targets, { paused: true, onStart: notifyProgress });
                if (photoImg) {
                  photoImg.addEventListener("revealcomplete", () => anim.play(), { once: true });
                } else {
                  anim.play();
                }
                return;
              }
              const percent = parseFloat(el.dataset.revealStart) || 80;
              const delay = parseFloat(el.dataset.revealDelay) || 0;
              let checkCount = 0;
              const reveal = () => {
                observer2.disconnect();
                revealSplitTargets(targets, { delay, onStart: notifyProgress });
              };
              const observer2 = new IntersectionObserver((entries) => {
                checkCount += 1;
                if (!entries[0].isIntersecting) return;
                if (checkCount === 1) {
                  setTimeout(reveal, 300);
                } else {
                  reveal();
                }
              }, { rootMargin: `0px 0px -${100 - percent}% 0px`, threshold: 0 });
              observer2.observe(el);
            } catch (error) {
              reportScrollTriggerCorruption("initTextRevealAnimations (element)", error);
              gsap.set(el, { autoAlpha: 1 });
              hadElementError = true;
              notifyProgress();
            }
          });
          if (hadElementError) {
            console.warn("[ScrollTrigger] Corruption d\xE9tect\xE9e pendant initTextRevealAnimations \u2014 reset complet et nouvelle tentative.");
            scrollTriggerCorrupted = false;
            hardResetScrollTrigger();
            runAnimationInitsPass();
          }
        });
      });
    });
  }
  function initListRevealAnimations() {
    Array.from(document.querySelectorAll(".list-reveal")).filter((el) => !el.closest(".section_hero")).forEach((el) => {
      try {
        const items = Array.from(el.querySelectorAll("li"));
        if (!items.length) {
          gsap.set(el, { autoAlpha: 1 });
          return;
        }
        gsap.set(el, { autoAlpha: 1 });
        gsap.set(items, { yPercent: 100, opacity: 0 });
        const percent = parseFloat(el.dataset.revealStart) || 80;
        const delay = parseFloat(el.dataset.revealDelay) || 0;
        let checkCount = 0;
        const reveal = () => {
          observer2.disconnect();
          gsap.to(items, {
            yPercent: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.15,
            delay,
            ease: "power3.out"
          });
        };
        const observer2 = new IntersectionObserver((entries) => {
          checkCount += 1;
          if (!entries[0].isIntersecting) return;
          if (checkCount === 1) {
            setTimeout(reveal, 300);
          } else {
            reveal();
          }
        }, { rootMargin: `0px 0px -${100 - percent}% 0px`, threshold: 0 });
        observer2.observe(el);
      } catch (error) {
        reportScrollTriggerCorruption("initListRevealAnimations (element)", error);
        gsap.set(el, { autoAlpha: 1 });
      }
    });
  }
  function initTextScrubReveal() {
    if (typeof SplitText === "undefined") return;
    const elements2 = document.querySelectorAll(".text-scrub");
    if (!elements2.length) return;
    elements2.forEach((el) => {
      if (el._scrubSplit) el._scrubSplit.revert();
      el.offsetHeight;
      const split = new SplitText(el, { type: "chars,words" });
      el._scrubSplit = split;
      gsap.set(split.chars, { opacity: 0.15 });
      try {
        gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "bottom 30%",
            scrub: 1
          }
        }).to(split.chars, {
          opacity: 1,
          stagger: { each: 0.03 },
          ease: "none"
        });
      } catch (error) {
        reportScrollTriggerCorruption("initTextScrubReveal (element)", error);
        gsap.set(split.chars, { opacity: 1 });
      }
    });
  }
  function initStaggerReveal() {
    const groups = [
      ...Array.from(document.querySelectorAll("[data-stagger-group]")).map((group) => ({
        group,
        items: Array.from(group.querySelectorAll("[data-stagger-item]")),
        start: group.dataset.staggerStart || "top 85%",
        delay: parseFloat(group.dataset.staggerDelay) || 0
      })),
      // Groupes du thème déclarés par classe (composants rs_*)
      ...Array.from(document.querySelectorAll(".faq-list")).map((group) => ({
        group,
        items: Array.from(group.querySelectorAll(".faq-item")),
        start: "top 85%",
        delay: 0
      })),
      ...Array.from(document.querySelectorAll(".social-icons")).map((group) => ({
        group,
        items: Array.from(group.querySelectorAll(".social-reveal-item")),
        start: "top 98%",
        delay: 0
      }))
    ];
    groups.forEach(({ items, start, delay }) => {
      if (!items.length) return;
      gsap.set(items, { y: 40, opacity: 0 });
      try {
        gsap.to(items, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay,
          ease: "power4.out",
          stagger: { amount: 0.4 },
          // clearProps:'transform' une fois l'animation finie : un translateY
          // même nul (0px) reste un transform CSS actif, qui crée un nouveau
          // contexte d'empilement sur l'item. Sans ça, un dropdown personnalisé
          // (.custom-select-options, z-index:20) ouvert DANS un item ne peut
          // jamais s'afficher au-dessus de l'item SUIVANT : ce contexte
          // d'empilement le confine visuellement à l'intérieur de son propre
          // item, peu importe son z-index.
          clearProps: "transform",
          scrollTrigger: {
            trigger: items[0],
            start,
            once: true
          }
        });
      } catch (error) {
        reportScrollTriggerCorruption("initStaggerReveal (group)", error);
        gsap.set(items, { y: 0, opacity: 1, clearProps: "transform" });
      }
    });
  }
  function initFooterMenuReveal() {
    const links = gsap.utils.toArray(".footer-menu-link");
    if (!links.length) return;
    gsap.set(links, { yPercent: 100, opacity: 0 });
    try {
      gsap.to(links, {
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: links[0],
          start: "top 90%",
          once: true
        }
      });
    } catch (error) {
      reportScrollTriggerCorruption("initFooterMenuReveal", error);
      gsap.set(links, { yPercent: 0, opacity: 1 });
    }
  }
  function initSlideUp() {
    document.querySelectorAll(".slide-up").forEach((el) => {
      try {
        gsap.from(el, {
          y: 100,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: `top ${el.dataset.revealStart || "85%"}`,
            once: true
          }
        });
      } catch (error) {
        reportScrollTriggerCorruption("initSlideUp (element)", error);
        gsap.set(el, { y: 0 });
      }
    });
  }
  function initButtonReveal() {
    document.querySelectorAll(".btn").forEach((btn) => {
      var _a;
      if (btn.closest(".hero-bottom-row")) return;
      if (btn.closest("#masthead")) return;
      if (btn.closest("#newsletter")) return;
      if ((_a = btn.closest("form")) == null ? void 0 : _a.querySelector('input[name="consentement"]')) return;
      try {
        gsap.fromTo(
          btn,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: btn,
              start: "top 90%",
              once: true
            }
          }
        );
      } catch (error) {
        reportScrollTriggerCorruption("initButtonReveal (element)", error);
        gsap.set(btn, { y: 0, opacity: 1 });
      }
    });
  }
  function initFadeInAnimations() {
    gsap.utils.toArray(".fade-in").forEach((element, i) => {
      try {
        const waitForEvent = element.dataset.fadeWaitFor;
        const customDelay = parseFloat(element.dataset.fadeDelay);
        const delay = Number.isNaN(customDelay) ? i * 0.1 : customDelay;
        const customDuration = parseFloat(element.dataset.fadeDuration);
        const duration = Number.isNaN(customDuration) ? 1 : customDuration;
        const anim = gsap.fromTo(
          element,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration,
            delay: waitForEvent ? 0 : delay,
            ease: "power2.out",
            paused: !!waitForEvent,
            scrollTrigger: waitForEvent ? void 0 : {
              // once, et SURTOUT pas `toggleActions: 'play none none reverse'` :
              // le `reverse` final rejouait l'animation à l'envers dès qu'on
              // remontait au-dessus du point de déclenchement. Les surtitres,
              // boutons et cartouches s'effaçaient donc en cours de scroll, puis
              // réapparaissaient — on lisait ça comme un bug d'affichage, pas
              // comme une intention.
              //
              // `once` détruit aussi le trigger après coup, ce qui allège le
              // registre ScrollTrigger (voir la note sur sa corruption au-delà
              // d'une vingtaine de triggers, plus haut dans ce fichier).
              trigger: element,
              start: "top 85%",
              once: true
            }
          }
        );
        if (waitForEvent) {
          document.addEventListener(waitForEvent, () => anim.play(), { once: true });
        }
      } catch (error) {
        reportScrollTriggerCorruption("initFadeInAnimations (element)", error);
        gsap.set(element, { opacity: 1, y: 0 });
      }
    });
  }
  function initGsapFadeIn() {
    gsap.utils.toArray(".gsap-fade-in").forEach((element) => {
      try {
        gsap.fromTo(
          element,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 90%",
              once: true
            }
          }
        );
      } catch (error) {
        reportScrollTriggerCorruption("initGsapFadeIn (element)", error);
        gsap.set(element, { opacity: 1, y: 0 });
      }
    });
  }
  function initGalerieReveal() {
    const outer = queryVisible(".galerie-outer");
    if (!outer) return;
    try {
      gsap.fromTo(
        outer,
        { clipPath: "inset(0 25%)" },
        {
          clipPath: "inset(0 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: outer,
            start: "top 85%",
            end: "top 15%",
            scrub: 1
          }
        }
      );
    } catch (error) {
      reportScrollTriggerCorruption("initGalerieReveal", error);
      gsap.set(outer, { clipPath: "inset(0 0%)" });
    }
  }
  function initGalerieThumbReveal() {
    document.querySelectorAll(".galerie-thumb-slide img").forEach((img) => {
      whenImagesReady([img], () => {
        mediaRevealImage(img, gsap.timeline(), 0.8, 0);
      });
    });
  }
  function initGalerieSwipers() {
    if (typeof Swiper === "undefined") return;
    document.querySelectorAll('.section_galerie[id^="rs-galerie-"]').forEach((root) => {
      try {
        const thumbsEl = root.querySelector(".rs-slider-thumbs");
        const mainEl = root.querySelector(".rs-slider-main");
        if (!mainEl) return;
        const updateThumbsAlignment = () => {
          if (!thumbsEl) return;
          const wrapper = thumbsEl.querySelector(".swiper-wrapper");
          const slides = wrapper ? wrapper.querySelectorAll(".swiper-slide") : [];
          const totalWidth = Array.from(slides).reduce((sum, s) => sum + s.offsetWidth, 0) + Math.max(0, slides.length - 1) * 8;
          thumbsEl.classList.toggle("rs-slider-thumbs--underfull", totalWidth <= thumbsEl.clientWidth);
        };
        const thumbs = thumbsEl ? new Swiper(thumbsEl, {
          spaceBetween: 8,
          slidesPerView: 2.5,
          watchSlidesProgress: true,
          on: {
            init: updateThumbsAlignment,
            resize: updateThumbsAlignment
          }
        }) : null;
        const slideCount = mainEl.querySelectorAll(".swiper-slide").length;
        const prevEl = document.getElementById(`${root.id}-prev`);
        const nextEl = document.getElementById(`${root.id}-next`);
        const main = new Swiper(mainEl, __spreadProps(__spreadValues(__spreadValues({
          loop: slideCount > 2,
          effect: "fade"
        }, thumbs ? { thumbs: { swiper: thumbs } } : {}), prevEl && nextEl ? { navigation: { prevEl, nextEl } } : {}), {
          on: {
            slideChange() {
              root.querySelectorAll(".rs-slider-thumbs .swiper-slide").forEach((el, i) => {
                el.style.opacity = i === this.realIndex ? "1" : "0.7";
              });
            }
          }
        }));
        if (!thumbs) return;
        root.querySelectorAll(".rs-slider-thumbs .swiper-slide").forEach((el, i) => {
          el.addEventListener("click", () => main.slideToLoop(i));
          el.style.opacity = i === 0 ? "1" : "0.7";
        });
      } catch (error) {
        console.error(`Error in initGalerieSwipers (${root.id || "galerie"}):`, error);
      }
    });
  }
  function initCarousels() {
    if (typeof Swiper === "undefined") return;
    document.querySelectorAll(".rs-carousel .rs-carousel-swiper").forEach((el) => {
      new Swiper(el, {
        slidesPerView: 1.3,
        spaceBetween: 16,
        // Curseur main (grab/grabbing) : signale que le carrousel se fait glisser.
        grabCursor: true,
        breakpoints: {
          768: {
            slidesPerView: 2.6,
            spaceBetween: 24
          }
        }
      });
    });
  }
  function initEventCarousels() {
    if (typeof Swiper === "undefined") return;
    document.querySelectorAll(".event-carousel__swiper").forEach((el) => {
      if (el.swiper) return;
      const prevEl = document.getElementById(`${el.id}-prev`);
      const nextEl = document.getElementById(`${el.id}-next`);
      new Swiper(el, __spreadValues({
        slidesPerView: 1.08,
        spaceBetween: 12,
        grabCursor: true,
        // Pas de loop : les flèches doivent pouvoir se désactiver en début et en
        // fin de liste (voir .swiper-button-disabled), ce que le mode boucle
        // rend impossible — il n'y a alors jamais de fin.
        watchOverflow: true,
        breakpoints: {
          640: { slidesPerView: 1.6, spaceBetween: 14 },
          1024: { slidesPerView: 2.25, spaceBetween: 16 }
        }
      }, prevEl && nextEl ? { navigation: { prevEl, nextEl } } : {}));
    });
  }
  function initVideoReveal() {
    const outer = queryVisible(".scroll-video-outer");
    if (!outer) return;
    try {
      gsap.fromTo(
        outer,
        { scale: 0.5 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: outer,
            // Fonctions (untransformedDocTop + offsetHeight, insensibles au
            // transform) plutôt que 'top bottom'/'bottom bottom' : le scale:0.5
            // du fromTo s'applique immédiatement à la création (avant la
            // mesure), et outer est aussi le trigger — sans ça, ScrollTrigger
            // mesure sa position/hauteur déjà réduites, donc l'échelle atteint 1
            // avant que la vidéo soit réellement à l'écran.
            start: () => untransformedDocTop(outer) - window.innerHeight,
            end: () => untransformedDocTop(outer) + outer.offsetHeight * 0.75 - window.innerHeight,
            // scrub:true (sync instantané), pas scrub:1 : ce ScrollTrigger est
            // créé après l'intro du hero, donc "tard" par rapport au chargement
            // — un scrub numérique (lag lissé) produit alors un rattrapage
            // visible depuis la valeur de scale initiale vers la vraie valeur
            // dérivée du scroll, ce qui casse le côté smooth au lieu de l'assurer.
            scrub: true
          }
        }
      );
    } catch (error) {
      reportScrollTriggerCorruption("initVideoReveal (scale scrub)", error);
      gsap.set(outer, { scale: 1 });
    }
    try {
      gsap.from(outer, {
        y: 80,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: outer,
          start: "top 85%",
          once: true
        }
      });
    } catch (error) {
      reportScrollTriggerCorruption("initVideoReveal (fade-in)", error);
      gsap.set(outer, { y: 0, opacity: 1 });
    }
  }
  function initFaqAccordion() {
    document.querySelectorAll(".faq-question").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemEl = btn.closest(".faq-item");
        const answerEl = itemEl.querySelector(".faq-answer");
        const wasOpen = btn.getAttribute("aria-expanded") === "true";
        const scope = itemEl.closest(".faq-list") || document;
        scope.querySelectorAll(".faq-item").forEach((el) => {
          el.querySelector(".faq-answer").style.maxHeight = "0";
          el.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        });
        if (!wasOpen) {
          answerEl.style.maxHeight = `${answerEl.scrollHeight}px`;
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }
  var PARALLAX_EASE = 0.1;
  var parallaxItems = [];
  function parallaxMap(x, a, b, c, d) {
    return (x - a) * (d - c) / (b - a) + c;
  }
  function parallaxLerp(a, b, n) {
    return (1 - n) * a + n * b;
  }
  function destroyColumnParallax() {
    parallaxItems.forEach(({ tick, observer: observer2 }) => {
      gsap.ticker.remove(tick);
      observer2.disconnect();
    });
    parallaxItems = [];
  }
  function initColumnParallax() {
    document.querySelectorAll(".scroll-parallax-img").forEach((img) => {
      const wrap = img.closest(".photo-trio-item") || img.closest(".section_galerie") || img.parentElement;
      if (!wrap) return;
      const maxValue = parseInt(getComputedStyle(img).getPropertyValue("--overflow"), 10) || 100;
      const minValue = -maxValue;
      const getTarget = () => {
        const rect = wrap.getBoundingClientRect();
        const value = parallaxMap(rect.top, window.innerHeight, -rect.height, minValue, maxValue);
        return Math.max(Math.min(value, maxValue), minValue);
      };
      let previous = getTarget();
      gsap.set(img, { y: previous });
      let isVisible = false;
      const observer2 = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.intersectionRatio > 0;
        });
      });
      observer2.observe(wrap);
      const tick = () => {
        if (!isVisible) return;
        previous = parallaxLerp(previous, getTarget(), PARALLAX_EASE);
        gsap.set(img, { y: previous });
      };
      gsap.ticker.add(tick);
      parallaxItems.push({ tick, observer: observer2 });
    });
  }
  function initHoverZoom(itemSelector, { scale = 1.05, duration = 0.5 } = {}) {
    gsap.utils.toArray(itemSelector).forEach((item) => {
      const target = item.querySelector("img") || item;
      gsap.set(target, { transformOrigin: "center center" });
      item.addEventListener("mouseenter", () => {
        gsap.to(target, { scale, duration, ease: "power2.out" });
      });
      item.addEventListener("mouseleave", () => {
        gsap.to(target, { scale: 1, duration, ease: "power2.out" });
      });
    });
  }
  function initCardHoverAnimations() {
    initHoverZoom(".card", { scale: 1.02, duration: 0.3 });
    initHoverZoom(".rs-carousel-slide");
    initHoverZoom(".hover-zoom");
  }
  function initScrollDownButton() {
    const btn = queryVisible(".scroll-down");
    if (!btn) return;
    btn.style.cursor = "pointer";
    btn.addEventListener("click", () => {
      const currentSection = btn.closest("section");
      const nextSection = currentSection ? currentSection.nextElementSibling : null;
      if (!nextSection) return;
      const lenis2 = getLenis();
      if (lenis2) {
        lenis2.scrollTo(nextSection, {
          offset: 0,
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        nextSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
  var anchorScrollBound = false;
  function initAnchorScroll() {
    if (anchorScrollBound) return;
    anchorScrollBound = true;
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link || link.hasAttribute("data-barba")) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      const lenis2 = getLenis();
      if (lenis2) {
        lenis2.scrollTo(target, {
          offset: -150,
          duration: 2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
  function initHeroIntro(onDone, curtainPromise) {
    const lenis2 = getLenis();
    let scrollLocked = false;
    const lockScroll = () => {
      scrollLocked = true;
      if (lenis2) lenis2.stop();
    };
    const unlockScroll = () => {
      if (!scrollLocked) return;
      scrollLocked = false;
      if (lenis2) lenis2.start();
    };
    const done = () => {
      unlockScroll();
      if (typeof onDone === "function") onDone();
    };
    const menuOverlay = document.getElementById("mobile-menu-overlay");
    const isMenuOpen = menuOverlay && menuOverlay.classList.contains("active");
    const header = isMenuOpen ? null : document.querySelector("#masthead");
    const hero = queryVisible(".section_hero");
    if (!hero || typeof SplitText === "undefined") {
      if (header) gsap.set(header, { y: 0, opacity: 1 });
      if (curtainPromise && document.body.classList.contains("wait-curtain-text-reveal")) {
        curtainPromise.then(done).catch(done);
      } else {
        done();
      }
      return;
    }
    lockScroll();
    gsap.registerPlugin(SplitText);
    const title = hero.querySelector("h1");
    const description = hero.querySelector(".section_hero_content .text-reveal");
    const bottomRow = hero.querySelector(".hero-bottom-row");
    const bottomRowLine = hero.querySelector(".hero-bottom-row-line");
    const heroImg = hero.querySelector("picture img");
    const mediaItems = Array.from(hero.querySelectorAll(".hero-media-item"));
    if (header) gsap.set(header, { y: -40, opacity: 0 });
    if (title) gsap.set(title, { autoAlpha: 0 });
    if (description) gsap.set(description, { autoAlpha: 0 });
    if (bottomRow) {
      gsap.set(bottomRow, { y: 60, opacity: 0 });
    }
    if (bottomRowLine) {
      gsap.set(bottomRowLine, { scaleX: 0, transformOrigin: "left center" });
    }
    if (mediaItems.length) {
      gsap.set(mediaItems, { y: 70, opacity: 0 });
    }
    const run = () => {
      try {
        if (prefersReducedMotion()) {
          if (header) gsap.set(header, { y: 0, opacity: 1 });
          if (title) gsap.set(title, { autoAlpha: 1 });
          if (description) gsap.set(description, { autoAlpha: 1 });
          if (bottomRow) gsap.set(bottomRow, { y: 0, opacity: 1 });
          if (bottomRowLine) gsap.set(bottomRowLine, { scaleX: 1 });
          if (mediaItems.length) gsap.set(mediaItems, { y: 0, opacity: 1 });
          done();
          return;
        }
        const titleTargets = title ? splitForReveal(title).targets : null;
        if (title) {
          gsap.set(title, { autoAlpha: 1 });
          gsap.set(titleTargets, REVEAL_FROM);
        }
        const descTargets = description ? splitForReveal(description).targets : null;
        if (description) {
          gsap.set(description, { autoAlpha: 1 });
          gsap.set(descTargets, REVEAL_FROM);
        }
        const tl = gsap.timeline({ delay: 0.8, onComplete: done });
        if (header) {
          tl.to(header, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0);
        }
        if (titleTargets) {
          tl.add(revealSplitTargets(titleTargets), 0);
        }
        if (descTargets) {
          tl.add(revealSplitTargets(descTargets), title ? 0.35 : 0);
        }
        if (bottomRowLine) {
          tl.to(bottomRowLine, { scaleX: 1, duration: 0.5, ease: "power2.out" }, "-=0.3");
        }
        if (bottomRow) {
          tl.to(bottomRow, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" });
        }
        if (mediaItems.length) {
          tl.to(mediaItems, {
            y: 0,
            opacity: 1,
            duration: 1.1,
            stagger: 0.18,
            ease: "power3.out"
          }, 0.2);
        }
      } catch (error) {
        console.error("Error in initHeroIntro run():", error);
        if (mediaItems.length) gsap.set(mediaItems, { y: 0, opacity: 1 });
        if (header) gsap.set(header, { y: 0, opacity: 1 });
        done();
      }
    };
    const waitForImage = new Promise((resolve) => {
      if (!heroImg) return resolve();
      if (heroImg.classList.contains("lazyloaded") || heroImg.complete && heroImg.currentSrc) {
        return resolve();
      }
      heroImg.addEventListener("lazyloaded", resolve, { once: true });
      heroImg.addEventListener("load", resolve, { once: true });
      heroImg.addEventListener("error", resolve, { once: true });
      return void 0;
    });
    const waitForFonts = Promise.all(
      [title, description].filter(Boolean).map((el) => {
        const cs = getComputedStyle(el);
        return document.fonts.load(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`).catch(() => {
        });
      })
    );
    Promise.race([
      Promise.all([waitForFonts, waitForImage]),
      new Promise((resolve) => setTimeout(resolve, 5e3))
    ]).then(() => setTimeout(run, 100));
  }
  function initPageEntryAnimation() {
    const container = document.querySelector('[data-barba="container"]');
    if (container && typeof gsap !== "undefined") {
      gsap.set(container, { opacity: 1 });
    }
  }

  // src/js/header.js
  var { gsap: gsap2, ScrollTrigger: ScrollTrigger2 } = window;
  function initHeaderScroll() {
    const header = document.getElementById("masthead");
    if (!header || typeof gsap2 === "undefined" || typeof ScrollTrigger2 === "undefined") {
      return;
    }
    const darkSections = Array.from(document.querySelectorAll(".section_hero, .header-dark-section"));
    const isOverlappingHeader = (section) => {
      const headerRect = header.getBoundingClientRect();
      const rect = section.getBoundingClientRect();
      return rect.top <= headerRect.bottom && rect.bottom > headerRect.top;
    };
    const updateHeaderState = () => {
      const measurable = darkSections.filter((section) => section.getBoundingClientRect().height > 0);
      if (darkSections.length > 0 && measurable.length === 0) return;
      const overDarkSection = measurable.some(isOverlappingHeader);
      header.classList.toggle("header-scrolled", !overDarkSection);
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateHeaderState();
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    if (initHeaderScroll._cleanup) {
      initHeaderScroll._cleanup();
    }
    const timeouts = [100, 300, 600, 1e3, 1800].map((delay) => setTimeout(updateHeaderState, delay));
    ScrollTrigger2.addEventListener("refresh", updateHeaderState);
    window.addEventListener("load", updateHeaderState);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateHeaderState);
    }
    initHeaderScroll._cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      timeouts.forEach(clearTimeout);
      ScrollTrigger2.removeEventListener("refresh", updateHeaderState);
      window.removeEventListener("load", updateHeaderState);
    };
  }

  // src/js/utils.js
  function addBarbaToLinks() {
    const links = document.querySelectorAll("a[href]");
    const currentDomain = window.location.hostname;
    let addedCount = 0;
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (link.hasAttribute("data-barba") || link.hasAttribute("data-barba-prevent")) {
        return;
      }
      if ((href == null ? void 0 : href.startsWith("http")) && !href.includes(currentDomain)) return;
      if (href == null ? void 0 : href.startsWith("#")) return;
      if (href == null ? void 0 : href.startsWith("mailto:")) return;
      if (href == null ? void 0 : href.startsWith("tel:")) return;
      if (href == null ? void 0 : href.includes("/wp-admin")) return;
      if (href == null ? void 0 : href.includes("/wp-login")) return;
      if (href && (href.startsWith("/") || href.includes(currentDomain) || !href.includes("http"))) {
        link.setAttribute("data-barba", "");
        addedCount++;
      }
    });
  }
  function updateCurrentMenuItem() {
    const currentUrl = window.location.pathname;
    const menuItems = document.querySelectorAll("#site-navigation .menu-item, #mobile-primary-menu .menu-item");
    menuItems.forEach((item) => {
      const link = item.querySelector("a");
      if (link) {
        try {
          const linkUrl = new URL(link.href).pathname;
          const normalizedCurrentUrl = currentUrl.replace(/\/$/, "") || "/";
          const normalizedLinkUrl = linkUrl.replace(/\/$/, "") || "/";
          if (normalizedLinkUrl === normalizedCurrentUrl) {
            item.classList.add("current-menu-item");
          } else {
            item.classList.remove("current-menu-item", "current_page_item");
          }
        } catch (e) {
          console.warn("Could not parse URL:", link.href);
        }
      }
    });
  }
  function setPendingMenuActive(trigger) {
    var _a, _b, _c;
    const link = (_a = trigger == null ? void 0 : trigger.closest) == null ? void 0 : _a.call(trigger, ".mobile-menu-link");
    const item = (_b = link == null ? void 0 : link.closest) == null ? void 0 : _b.call(link, ".mobile-menu-item");
    const list = (_c = link == null ? void 0 : link.closest) == null ? void 0 : _c.call(link, ".mobile-menu-list");
    if (!link || !item || !list) return;
    list.querySelectorAll(".mobile-menu-item").forEach((li) => {
      li.classList.remove("is-navigating-active", "current-menu-item", "current_page_item");
    });
    item.classList.add("is-navigating-active");
    list.classList.add("is-navigating");
  }
  function clearPendingMenuActive() {
    document.querySelectorAll(".mobile-menu-list.is-navigating").forEach((list) => {
      list.classList.remove("is-navigating");
      list.querySelectorAll(".is-navigating-active").forEach((li) => li.classList.remove("is-navigating-active"));
    });
  }
  function configureScrollRestoration() {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }
  function forceScrollToTop() {
    window.scrollTo(0, 0);
  }
  function initFooterMenuSamePageScroll() {
    const footerLinks = document.querySelectorAll(".footer-menu-link");
    footerLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        let linkUrl;
        try {
          linkUrl = new URL(link.href, window.location.href);
        } catch (err) {
          return;
        }
        if (linkUrl.origin !== window.location.origin || linkUrl.hash) {
          return;
        }
        const normalizedLink = linkUrl.pathname.replace(/\/$/, "") || "/";
        const normalizedCurrent = window.location.pathname.replace(/\/$/, "") || "/";
        if (normalizedLink === normalizedCurrent) {
          e.preventDefault();
          scrollToTop();
        }
      });
    });
  }
  function initNumericFieldSanitization() {
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      if (!target.matches || !target.matches('.reservation-form input[type="number"]')) {
        return;
      }
      if (["e", "E", "+", "-"].includes(event.key)) {
        event.preventDefault();
      }
    });
    document.addEventListener("input", (event) => {
      const target = event.target;
      if (!target.matches) return;
      if (target.matches('.reservation-form input[type="number"]')) {
        const sanitized = target.value.replace(/[^\d]/g, "");
        if (sanitized !== target.value) {
          target.value = sanitized;
        }
        return;
      }
      if (target.matches('.reservation-form input[type="tel"]')) {
        const sanitized = target.value.replace(/[^\d+\s().-]/g, "");
        if (sanitized !== target.value) {
          target.value = sanitized;
        }
      }
    });
  }

  // src/js/components/scroll-video.js
  var observer = null;
  var youtubeApiPromise = null;
  var youtubePlayers = /* @__PURE__ */ new Map();
  function loadYoutubeApi() {
    if (window.YT && window.YT.Player) {
      return Promise.resolve(window.YT);
    }
    if (youtubeApiPromise) {
      return youtubeApiPromise;
    }
    youtubeApiPromise = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousCallback === "function") previousCallback();
        resolve(window.YT);
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    });
    return youtubeApiPromise;
  }
  function initYoutubePlayer(wrapperEl, targetEl) {
    const videoId = targetEl.dataset.youtubeId;
    if (!videoId || youtubePlayers.has(wrapperEl)) return;
    const loop = wrapperEl.dataset.loop === "1";
    loadYoutubeApi().then((YT) => {
      if (!document.body.contains(targetEl)) return;
      let loopWatcher = null;
      const stopLoopWatcher = () => {
        if (loopWatcher) {
          clearInterval(loopWatcher);
          loopWatcher = null;
        }
      };
      const player = new YT.Player(targetEl, {
        videoId,
        playerVars: {
          // autoplay:1 fait passer le lecteur en lecture dès qu'il est prêt : ça
          // évite l'état "en pause" de YouTube qui affiche le titre/la chaîne en
          // surimpression. L'IntersectionObserver le remet en pause aussitôt
          // après si la vidéo n'est pas encore visible à l'écran.
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.setPlaybackQuality("hd1080");
            if (!wrapperEl.dataset.inView) {
              e.target.pauseVideo();
            }
          },
          // Boucle maison : on ne laisse jamais la vidéo atteindre sa toute fin
          // (contrairement à loop/playlist natifs) car YouTube y affiche une
          // carte "vidéos suggérées" en surimpression dans les dernières
          // secondes, qu'aucun paramètre d'API ne permet de désactiver.
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              e.target.setPlaybackQuality("hd1080");
            }
            if (!loop) return;
            if (e.data === YT.PlayerState.PLAYING) {
              stopLoopWatcher();
              loopWatcher = setInterval(() => {
                const duration = e.target.getDuration();
                const current = e.target.getCurrentTime();
                if (duration && duration - current < 2) {
                  e.target.seekTo(0, true);
                }
              }, 500);
            } else {
              stopLoopWatcher();
            }
          }
        }
      });
      youtubePlayers.set(wrapperEl, player);
    });
  }
  function toggleMute(button) {
    const section = button.closest(".scroll-video-section");
    const target = section && section.querySelector("[data-scroll-video]");
    if (!target) return;
    const setLabel = (isUnmuted) => {
      const label = isUnmuted ? button.dataset.labelUnmuted : button.dataset.labelMuted;
      if (!label) return;
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    };
    if (target.tagName === "VIDEO") {
      target.muted = !target.muted;
      button.classList.toggle("is-unmuted", !target.muted);
      button.setAttribute("aria-pressed", String(!target.muted));
      setLabel(!target.muted);
      return;
    }
    const player = youtubePlayers.get(target);
    if (!player || typeof player.isMuted !== "function") return;
    const wasMuted = player.isMuted();
    if (wasMuted) {
      player.unMute();
    } else {
      player.mute();
    }
    button.classList.toggle("is-unmuted", wasMuted);
    button.setAttribute("aria-pressed", String(wasMuted));
    setLabel(wasMuted);
  }
  function initMuteToggles() {
    document.querySelectorAll("[data-scroll-video-mute]").forEach((button) => {
      button.addEventListener("click", () => toggleMute(button));
    });
  }
  function initScrollVideo() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    youtubePlayers.forEach((player, wrapperEl) => {
      if (!document.body.contains(wrapperEl)) {
        try {
          player.destroy();
        } catch (e) {
        }
        youtubePlayers.delete(wrapperEl);
      }
    });
    const elements2 = document.querySelectorAll("[data-scroll-video]");
    if (!elements2.length) return;
    elements2.forEach((el) => {
      const target = el.querySelector("[data-youtube-id]");
      if (target) {
        initYoutubePlayer(el, target);
      }
    });
    const MOBILE_BREAKPOINT = "(max-width: 767px)";
    elements2.forEach((el) => {
      if (el.tagName === "VIDEO" && el.dataset.srcMobile && window.matchMedia(MOBILE_BREAKPOINT).matches) {
        el.src = el.dataset.srcMobile;
      }
    });
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.dataset.inView = "1";
        } else {
          delete el.dataset.inView;
        }
        if (el.querySelector("[data-youtube-id]")) {
          const player = youtubePlayers.get(el);
          if (!player || typeof player.playVideo !== "function") return;
          if (entry.isIntersecting) {
            player.playVideo();
          } else {
            player.pauseVideo();
          }
          return;
        }
        if (typeof el.play !== "function") return;
        if (entry.isIntersecting) {
          el.play().catch(() => {
          });
        } else {
          el.pause();
        }
      });
    }, { threshold: 0.5 });
    elements2.forEach((el) => observer.observe(el));
    initMuteToggles();
  }

  // src/js/components/custom-select.js
  function selectCustomSelectOption(nativeSelect, value) {
    const wrapper = nativeSelect.closest(".custom-select");
    if (!wrapper) return;
    const valueEl = wrapper.querySelector(".custom-select-value");
    const options = Array.from(wrapper.querySelectorAll(".custom-select-option"));
    const option = options.find((o) => o.dataset.value === value);
    if (!valueEl || !option) return;
    nativeSelect.value = value;
    valueEl.textContent = option.textContent;
    wrapper.classList.add("has-value");
    options.forEach((o) => o.classList.toggle("is-selected", o === option));
    nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function initCustomSelects() {
    document.querySelectorAll(".custom-select").forEach((wrapper) => {
      if (wrapper.dataset.customSelectInit) return;
      wrapper.dataset.customSelectInit = "1";
      const trigger = wrapper.querySelector(".custom-select-trigger");
      const valueEl = wrapper.querySelector(".custom-select-value");
      const optionsList = wrapper.querySelector(".custom-select-options");
      const nativeSelect = wrapper.querySelector(".custom-select-native");
      const options = Array.from(wrapper.querySelectorAll(".custom-select-option"));
      if (!trigger || !valueEl || !optionsList || !nativeSelect) return;
      const closeDropdown = () => {
        wrapper.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      };
      const openDropdown = () => {
        wrapper.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      };
      const selectOption = (option) => {
        selectCustomSelectOption(nativeSelect, option.dataset.value);
        closeDropdown();
      };
      trigger.addEventListener("click", () => {
        if (wrapper.classList.contains("open")) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });
      options.forEach((option) => {
        option.addEventListener("click", () => selectOption(option));
      });
      document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target)) closeDropdown();
      });
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeDropdown();
      });
    });
  }

  // src/js/components/date-picker.js
  function initDatePickers() {
    if (typeof flatpickr === "undefined") return;
    document.querySelectorAll("input[data-flatpickr]").forEach((input) => {
      if (input._flatpickr) return;
      flatpickr(input, __spreadValues({
        locale: "fr",
        dateFormat: "d/m/Y",
        // Saisie manuelle désactivée (le champ est readonly côté markup) : on ne
        // veut jamais risquer qu'un format tapé à la main soit invalide.
        allowInput: false,
        // Flatpickr bascule par défaut vers le sélecteur natif du téléphone sur
        // mobile (voir flatpickr.js.org/mobile-support) — ce qui annulerait le
        // format JJ/MM/AAAA garanti ci-dessus, redevenu dépendant de la locale
        // de l'appareil.
        disableMobile: true
      }, input.dataset.minDate ? { minDate: input.dataset.minDate } : {}));
    });
    initTimePickers();
  }
  function initTimePickers() {
    document.querySelectorAll("input[data-flatpickr-time]").forEach((input) => {
      if (input._flatpickr) return;
      flatpickr(input, {
        locale: "fr",
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: false,
        // Même raison que les champs date : évite le fallback natif mobile, qui
        // réintroduirait le 12h/24h selon la locale de l'appareil.
        disableMobile: true
      });
    });
  }

  // src/js/barba.js
  var { barba, gsap: gsap3, ScrollTrigger: ScrollTrigger3 } = window;
  var isReloading = false;
  var slowLoadTimer = null;
  var SLOW_LOAD_TIMEOUT = 1e4;
  function showWaitCursor() {
    document.body.classList.add("page-loading");
  }
  function hideWaitCursor() {
    document.body.classList.remove("page-loading");
  }
  function getMaskLayers() {
    const mask = document.getElementById("page-transition-mask");
    return mask ? Array.from(mask.children).reverse() : [];
  }
  var MASK_LAYER_OFFSETS = [0, 0.18, 0.4];
  function animateMaskLayers(layers, yPercent, duration) {
    const tl = gsap3.timeline();
    layers.forEach((layer, i) => {
      tl.to(layer, { yPercent, duration, ease: "power2.inOut" }, MASK_LAYER_OFFSETS[i] || 0);
    });
    return tl;
  }
  function closeMobileMenu() {
    const menuOverlay = document.getElementById("mobile-menu-overlay");
    if (menuOverlay && menuOverlay.classList.contains("active")) {
      menuOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  }
  function waitForHeroImage(container) {
    const heroImg = container && container.querySelector(".section_hero picture img");
    return new Promise((resolve) => {
      if (!heroImg) return resolve();
      if (heroImg.classList.contains("lazyloaded") || heroImg.complete && heroImg.currentSrc) {
        return resolve();
      }
      const timeout = setTimeout(resolve, 5e3);
      const done = () => {
        clearTimeout(timeout);
        resolve();
      };
      heroImg.addEventListener("lazyloaded", done, { once: true });
      heroImg.addEventListener("load", done, { once: true });
      heroImg.addEventListener("error", done, { once: true });
      return void 0;
    });
  }
  function waitForAllImages(container) {
    if (!container) return Promise.resolve();
    const images = Array.from(container.querySelectorAll("img"));
    const pending = images.filter((img) => !(img.complete && img.currentSrc));
    if (!pending.length) return Promise.resolve();
    return new Promise((resolve) => {
      let remaining = pending.length;
      const timeout = setTimeout(resolve, 5e3);
      const done = () => {
        remaining -= 1;
        if (remaining <= 0) {
          clearTimeout(timeout);
          resolve();
        }
      };
      pending.forEach((img) => {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    });
  }
  function updateHeaderColor(container) {
    try {
      const headerColor = container.getAttribute("data-header-color") || "white";
      const header = document.getElementById("masthead");
      if (!header) {
        console.warn("\u26A0\uFE0F Header element not found");
        return;
      }
      header.classList.remove("header-black", "header-white");
      header.classList.add(headerColor === "black" ? "header-black" : "header-white");
    } catch (error) {
      console.error("\u274C Error updating header color:", error);
    }
  }
  function updateLangToggle(container) {
    try {
      const label = container.getAttribute("data-lang-label");
      const url = container.getAttribute("data-lang-url");
      const link = document.getElementById("header-lang-toggle");
      if (!link) return;
      if (label && url) {
        link.textContent = label;
        link.setAttribute("href", url);
        link.classList.remove("hidden");
      } else {
        link.classList.add("hidden");
      }
    } catch (error) {
      console.error("\u274C Error updating lang toggle:", error);
    }
  }
  function updatePersistentLayoutLinks(html) {
    try {
      if (!html) return;
      const nextDoc = new DOMParser().parseFromString(html, "text/html");
      [".site-logo", ".mobile-menu-logo"].forEach((selector) => {
        const nextLink = nextDoc.querySelector(selector);
        const currentLink = document.querySelector(selector);
        if (nextLink && currentLink) {
          currentLink.setAttribute("href", nextLink.getAttribute("href"));
        }
      });
      const nextBookBtn = nextDoc.getElementById("header-book-btn");
      const currentBookBtn = document.getElementById("header-book-btn");
      if (nextBookBtn && currentBookBtn) {
        currentBookBtn.setAttribute("href", nextBookBtn.getAttribute("href"));
        currentBookBtn.textContent = nextBookBtn.textContent;
      }
      const nextMenuBtn = nextDoc.getElementById("mobile-menu-button");
      const currentMenuBtn = document.getElementById("mobile-menu-button");
      if (nextMenuBtn && currentMenuBtn) {
        currentMenuBtn.textContent = nextMenuBtn.textContent;
      }
      const nextMobileLogo = nextDoc.querySelector(".mobile-menu-logo");
      const currentMobileLogo = document.querySelector(".mobile-menu-logo");
      if (nextMobileLogo && currentMobileLogo) {
        currentMobileLogo.setAttribute("href", nextMobileLogo.getAttribute("href"));
      }
      const nextMobileNav = nextDoc.querySelector(".mobile-menu-nav");
      const currentMobileNav = document.querySelector(".mobile-menu-nav");
      if (nextMobileNav && currentMobileNav) {
        currentMobileNav.innerHTML = nextMobileNav.innerHTML;
      }
      const nextFooter = nextDoc.querySelector("footer");
      const currentFooter = document.querySelector("footer");
      if (nextFooter && currentFooter) {
        currentFooter.innerHTML = nextFooter.innerHTML;
      }
    } catch (error) {
      console.error("\u274C Error updating persistent layout links:", error);
    }
  }
  function waitForNewContainer(timeout = 5e3) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkContainer = () => {
        const container = document.querySelector('[data-barba="container"]');
        if (container && container.offsetHeight > 0) {
          resolve(container);
        } else if (Date.now() - startTime > timeout) {
          console.warn("\u26A0\uFE0F Timeout waiting for container");
          reject(new Error("Container timeout"));
        } else {
          requestAnimationFrame(checkContainer);
        }
      };
      checkContainer();
    });
  }
  function handlePageReload() {
    if (isReloading) return;
    isReloading = true;
    showWaitCursor();
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
  function scrollToAnchor(hash) {
    if (!hash) return;
    const lenis2 = getLenis();
    setTimeout(() => {
      const target = document.querySelector(hash);
      if (!target) {
        console.warn("\u26A0\uFE0F Anchor target not found:", hash);
        return;
      }
      if (typeof ScrollTrigger3 !== "undefined") {
        ScrollTrigger3.refresh();
      }
      setTimeout(() => {
        if (lenis2) {
          lenis2.scrollTo(target, {
            offset: -150,
            // reste sous le header fixe
            duration: 2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          window.scrollTo({ top: target.offsetTop - 150, behavior: "smooth" });
        }
      }, 200);
    }, 600);
  }
  function initBarba() {
    if (typeof barba === "undefined") {
      console.error("\u274C Barba.js not loaded!");
      return;
    }
    const wrapper = document.querySelector('[data-barba="wrapper"]');
    const container = document.querySelector('[data-barba="container"]');
    if (!wrapper || !container) {
      return;
    }
    try {
      let targetHash = "";
      barba.init({
        debug: false,
        timeout: 1e4,
        // serveurs lents
        prevent: ({ el }) => {
          var _a;
          return ((_a = el.classList) == null ? void 0 : _a.contains("disabled-link")) || el.hasAttribute("data-barba-prevent");
        },
        transitions: [
          {
            name: "curtain-transition",
            async beforeLeave(data) {
              try {
                targetHash = "";
                showWaitCursor();
                setPendingMenuActive(data.trigger);
                if (data.trigger && data.trigger.href) {
                  const { href } = data.trigger;
                  if (href.includes("#")) {
                    targetHash = href.split("#")[1];
                  }
                  clearTimeout(slowLoadTimer);
                  slowLoadTimer = setTimeout(() => {
                    window.location.href = href;
                  }, SLOW_LOAD_TIMEOUT);
                }
              } catch (error) {
                console.error("Error in beforeLeave:", error);
                hideWaitCursor();
              }
            },
            async leave(data) {
              try {
                const menuOverlayOnLeave = document.getElementById("mobile-menu-overlay");
                const isMenuOpenOnLeave = menuOverlayOnLeave && menuOverlayOnLeave.classList.contains("active");
                const maskLayers = getMaskLayers();
                if (maskLayers.length && !isMenuOpenOnLeave) {
                  await animateMaskLayers(maskLayers, 0, 1.1);
                }
                try {
                  killAnimations();
                } catch (killError) {
                  console.error("Error in killAnimations (leave):", killError);
                }
                data.current.container.style.visibility = "hidden";
              } catch (error) {
                console.error("Error in leave:", error);
              }
            },
            beforeEnter(data) {
              try {
                clearTimeout(slowLoadTimer);
                if (!data.next.container || !(data.next.container instanceof HTMLElement)) {
                  console.error("\u274C Invalid next container:", data.next.container);
                  throw new Error("Invalid container");
                }
                updateLangToggle(data.next.container);
                updatePersistentLayoutLinks(data.next.html);
                const lenis2 = getLenis();
                if (data.current.container) {
                  data.current.container.style.display = "none";
                }
                gsap3.set(data.next.container, { opacity: 0 });
                try {
                  initAnimations();
                } catch (animError) {
                  console.error("Error in initAnimations (beforeEnter):", animError);
                }
                window.scrollTo(0, 0);
                if (lenis2) lenis2.scrollTo(0, { immediate: true });
              } catch (error) {
                console.error("Error in beforeEnter:", error);
                hideWaitCursor();
                throw error;
              }
            },
            async enter(data) {
              try {
                await gsap3.to({}, { duration: 0.1 });
                await waitForHeroImage(data.next.container);
                const menuOverlay = document.getElementById("mobile-menu-overlay");
                const isMenuOpen = menuOverlay && menuOverlay.classList.contains("active");
                const maskLayers = getMaskLayers();
                gsap3.set(data.next.container, { opacity: 1 });
                if (isMenuOpen && typeof window.rumhoraCloseMobileMenu === "function") {
                  await window.rumhoraCloseMobileMenu();
                  hideWaitCursor();
                } else {
                  if (maskLayers.length) {
                    await animateMaskLayers(maskLayers, 100, 1.1);
                  }
                  hideWaitCursor();
                }
                if (maskLayers.length) gsap3.set(maskLayers, { yPercent: -100 });
                if (typeof ScrollTrigger3 !== "undefined") {
                  ScrollTrigger3.refresh();
                  waitForAllImages(data.next.container).then(() => {
                    ScrollTrigger3.refresh();
                  });
                }
              } catch (error) {
                console.error("Error in enter:", error);
                gsap3.set(data.next.container, { opacity: 1 });
                const maskLayers = getMaskLayers();
                if (maskLayers.length) gsap3.set(maskLayers, { yPercent: -100 });
                hideWaitCursor();
                closeMobileMenu();
              }
            },
            after(data) {
              try {
                if (typeof gtag === "function") {
                  gtag("event", "page_view", {
                    page_title: document.title,
                    page_location: window.location.href,
                    page_path: window.location.pathname
                  });
                }
                if (typeof fbq === "function") {
                  fbq("track", "PageView");
                }
                updateHeaderColor(data.next.container);
                addBarbaToLinks();
                initScrollToTop();
                updateCurrentMenuItem();
                clearPendingMenuActive();
                initHeaderScroll();
                initScrollVideo();
                initCustomSelects();
                initDatePickers();
                if (targetHash) {
                  window.history.replaceState(null, "", `${window.location.pathname}#${targetHash}`);
                }
                const hash = targetHash ? `#${targetHash}` : window.location.hash;
                if (hash) {
                  scrollToAnchor(hash);
                }
              } catch (error) {
                console.error("Error in after:", error);
              }
            }
          }
        ]
      });
    } catch (error) {
      console.error("\u274C Error initializing Barba.js:", error);
    }
  }
  function handleInitialAnchor() {
    const hash = window.location.hash;
    if (hash) {
      scrollToAnchor(hash);
    }
  }
  function handlePageLoadTransition() {
    const navigationEntries = performance.getEntriesByType("navigation");
    const isReload = navigationEntries.length > 0 && navigationEntries[0].type === "reload";
    if (!isReload) return;
    const container = document.querySelector('[data-barba="container"]');
    if (!container) return;
    showWaitCursor();
    gsap3.set(container, { opacity: 0 });
    waitForNewContainer().then(() => {
      gsap3.set(container, { opacity: 1 });
      hideWaitCursor();
    }).catch((error) => {
      console.error("Error in reload transition:", error);
      gsap3.set(container, { opacity: 1, y: 0 });
      hideWaitCursor();
    });
  }
  var MASK_REVEAL_DURATION = 1.1;
  var MASK_TOTAL_DURATION = MASK_LAYER_OFFSETS[MASK_LAYER_OFFSETS.length - 1] + MASK_REVEAL_DURATION;
  function initPageLoadCurtainReveal() {
    const maskLayers = getMaskLayers();
    if (!maskLayers.length) return Promise.resolve();
    showWaitCursor();
    const container = document.querySelector('[data-barba="container"]');
    return waitForHeroImage(container).then(() => {
      animateMaskLayers(maskLayers, 100, MASK_REVEAL_DURATION).then(() => {
        hideWaitCursor();
        gsap3.set(maskLayers, { yPercent: -100 });
      }).catch((error) => {
        console.error("Error in initPageLoadCurtainReveal:", error);
        hideWaitCursor();
        gsap3.set(maskLayers, { yPercent: -100 });
      });
      const earlyMs = Math.max(0, (MASK_TOTAL_DURATION - 1) * 1e3);
      return new Promise((resolve) => setTimeout(resolve, earlyMs));
    });
  }

  // src/js/components/rs-scroll.js
  var elements = null;
  var isDragging = false;
  var isHovered = false;
  var hideTimeout;
  function getMetrics(lenis2) {
    const viewportHeight = window.innerHeight;
    const trackHeight = viewportHeight;
    const documentHeight = viewportHeight + lenis2.limit;
    const thumbHeight = Math.max(viewportHeight / documentHeight * trackHeight, 30);
    const maxThumbTop = trackHeight - thumbHeight;
    return { thumbHeight, maxThumbTop };
  }
  function isOverPinnedSection() {
    return Array.from(document.querySelectorAll(".scrollbar-hide-section")).some((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
  }
  function showScrollbar() {
    if (!elements) return;
    if (isOverPinnedSection()) {
      clearTimeout(hideTimeout);
      elements.container.classList.remove("scrollbar--shown");
      return;
    }
    elements.container.classList.add("scrollbar--shown");
    clearTimeout(hideTimeout);
    if (isDragging || isHovered) return;
    hideTimeout = setTimeout(() => {
      elements.container.classList.remove("scrollbar--shown");
    }, 800);
  }
  function updateThumb(lenis2) {
    if (!elements || isDragging) return;
    const { thumbHeight, maxThumbTop } = getMetrics(lenis2);
    const thumbTop = lenis2.progress * maxThumbTop;
    elements.thumb.style.height = `${thumbHeight}px`;
    elements.thumb.style.transform = `translateY(${thumbTop}px)`;
    showScrollbar();
  }
  function initRsScroll(lenis2) {
    if (!lenis2 || elements) return;
    elements = { container: document.createElement("div") };
    elements.container.className = "scrollbar";
    elements.container.innerHTML = `
    <div class="scrollbar__track"></div>
    <div class="scrollbar__thumb"></div>
  `;
    elements.track = elements.container.querySelector(".scrollbar__track");
    elements.thumb = elements.container.querySelector(".scrollbar__thumb");
    document.body.appendChild(elements.container);
    elements.container.addEventListener("pointerenter", () => {
      isHovered = true;
      showScrollbar();
    });
    elements.container.addEventListener("pointerleave", () => {
      isHovered = false;
      showScrollbar();
    });
    elements.track.addEventListener("click", (e) => {
      if (e.target !== elements.track) return;
      const { maxThumbTop, thumbHeight } = getMetrics(lenis2);
      const rect = elements.track.getBoundingClientRect();
      const clickY = e.clientY - rect.top - thumbHeight / 2;
      const progress = maxThumbTop > 0 ? Math.min(Math.max(clickY, 0), maxThumbTop) / maxThumbTop : 0;
      lenis2.scrollTo(progress * lenis2.limit, { duration: 0.6 });
    });
    let dragStartY = 0;
    let dragStartThumbTop = 0;
    elements.thumb.addEventListener("pointerdown", (e) => {
      isDragging = true;
      elements.thumb.setPointerCapture(e.pointerId);
      elements.container.classList.add("scrollbar--is-dragging");
      document.body.classList.add("is-scrollbar-dragging");
      const { maxThumbTop } = getMetrics(lenis2);
      dragStartY = e.clientY;
      dragStartThumbTop = lenis2.progress * maxThumbTop;
      showScrollbar();
      e.preventDefault();
    });
    elements.thumb.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const { maxThumbTop } = getMetrics(lenis2);
      const deltaY = e.clientY - dragStartY;
      const newThumbTop = Math.min(Math.max(dragStartThumbTop + deltaY, 0), maxThumbTop);
      const progress = maxThumbTop > 0 ? newThumbTop / maxThumbTop : 0;
      lenis2.scrollTo(progress * lenis2.limit, { immediate: true });
    });
    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      elements.thumb.releasePointerCapture(e.pointerId);
      elements.container.classList.remove("scrollbar--is-dragging");
      document.body.classList.remove("is-scrollbar-dragging");
      showScrollbar();
    };
    elements.thumb.addEventListener("pointerup", endDrag);
    elements.thumb.addEventListener("pointercancel", endDrag);
    lenis2.on("scroll", () => updateThumb(lenis2));
  }

  // src/js/main.js
  window.handlePageReload = handlePageReload;
  var { gsap: gsap4, ScrollTrigger: ScrollTrigger4 } = window;
  if (!gsap4) {
    document.documentElement.classList.add("no-gsap");
    console.warn("[Rumhora] GSAP introuvable : animations d\xE9sactiv\xE9es, contenu affich\xE9 sans transition.");
  }
  if (gsap4 && ScrollTrigger4) {
    gsap4.registerPlugin(ScrollTrigger4);
    ScrollTrigger4.config({ ignoreMobileResize: true });
  }
  function refreshScrollTriggerWhenIdle() {
    const lenis2 = getLenis();
    if (!lenis2 || !lenis2.isScrolling) {
      ScrollTrigger4.refresh();
      return;
    }
    let attempts = 0;
    const maxAttempts = 20;
    const poll = setInterval(() => {
      attempts += 1;
      if (!lenis2.isScrolling || attempts >= maxAttempts) {
        clearInterval(poll);
        ScrollTrigger4.refresh();
      }
    }, 50);
  }
  if (typeof ScrollTrigger4 !== "undefined") {
    let lazyRefreshTimeout;
    document.addEventListener("lazyloaded", () => {
      clearTimeout(lazyRefreshTimeout);
      lazyRefreshTimeout = setTimeout(() => refreshScrollTriggerWhenIdle(), 150);
    });
  }
  configureScrollRestoration();
  forceScrollToTop();
  window.addEventListener("load", () => {
    if (!window.location.hash) {
      forceScrollToTop();
      const lenis2 = getLenis();
      if (lenis2) lenis2.scrollTo(0, { immediate: true });
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    handlePageLoadTransition();
    const curtainPromise = initPageLoadCurtainReveal();
    if (!window.location.hash) {
      forceScrollToTop();
    }
    initPageEntryAnimation();
    initLenis();
    initRsScroll(getLenis());
    initScrollToTop();
    initFooterMenuSamePageScroll();
    initAnimations(curtainPromise);
    addBarbaToLinks();
    initNumericFieldSanitization();
    initHeaderScroll();
    updateCurrentMenuItem();
    initBarba();
    handleInitialAnchor();
    initScrollVideo();
    initCustomSelects();
    initDatePickers();
  });
  function fallbackLazyImages() {
    if (window.lazySizes) return;
    console.warn("[Rumhora] lazysizes introuvable : chargement direct des images.");
    document.querySelectorAll("img[data-src], source[data-srcset]").forEach((el) => {
      if (el.dataset.src) el.src = el.dataset.src;
      if (el.dataset.srcset) el.srcset = el.dataset.srcset;
      el.classList.add("lazyloaded");
    });
  }
  window.addEventListener("load", () => {
    const lenis2 = getLenis();
    fallbackLazyImages();
    const hasAnchor = !!window.location.hash;
    if (!hasAnchor) {
      forceScrollToTop();
      if (lenis2) lenis2.scrollTo(0, { immediate: true });
    }
    if (typeof ScrollTrigger4 !== "undefined") {
      ScrollTrigger4.getAll().forEach((st) => st.disable());
      setTimeout(() => {
        if (!hasAnchor) {
          forceScrollToTop();
          if (lenis2) lenis2.scrollTo(0, { immediate: true });
        }
        ScrollTrigger4.getAll().forEach((st) => st.enable());
        ScrollTrigger4.refresh();
      }, 150);
    }
  });
})();

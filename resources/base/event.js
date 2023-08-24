ig.module('base.event')
  .requires('base.steps')
  .defines(() => {
    ig.EventCall = ig.Class.extend({
      runType: 0,
      done: false,
      blocked: false,
      stack: [],
      eventAttached: [],
      pauseParallel: false,
      onStart: null,
      onEnd: null,
      data: null,

      init(event, meta, runType, onStart, onEnd, data) {
        this.runType = runType || 0;
        this.onStart = onStart || null;
        this.onEnd = onEnd || null;
        this.data = data || null;
        event && this.callInlineEvent(event, meta);
      },

      hasHint(hint) {
        return this.stack[0] && this.stack[0].event.hasHint(hint);
      },

      callInlineEvent(event, meta) {
        let vars = event.setupInput(meta);
        this.stack.push({ event, currentStep: null, stepData: {}, vars });
        return this.stack[this.stack.length - 1];
      },

      addEventAttached(listener) {
        this.eventAttached.push(listener);
      },

      setDone() {
        this.done = true;
        for (let listener of this.eventAttached) listener.onEventEndDetach(this);
        this.eventAttached = [];
        if (this.onEnd) this.onEnd(this);
      },

      isBlocked() {
        return this.blocked;
      },
      isRunning() {
        return !this.done;
      },

      /** Authored by me, fixed by East_Arctica */
      performStep(stackItem) {
        do {
          if (!stackItem.currentStep) {
            stackItem.currentStep = stackItem.event.rootStep;
          }

          let step = stackItem.currentStep;
          if (!step) break;

          if (step.start) {
            step.start(stackItem.stepData, this)
          }

          if (step.getInlineEvent) {
            stackItem = this.callInlineEvent(step.getInlineEvent(), step.getInlineEventInput());
          }
        } while (!stackItem.currentStep)

        return stackItem;
      },

      /** Authored by me, fixed by East_Arctica */
      update() {
        var stackItem = this.stack[this.stack.length - 1];
        for (
          stackItem.currentStep || (stackItem = this.performStep(stackItem));
          stackItem.currentStep && stackItem.currentStep.run(stackItem.stepData);
        ) {
          var jumpLabel = null;
          if (stackItem.currentStep.getJumpLabelName) {
            var labelName = stackItem.currentStep.getJumpLabelName(stackItem.stepData);
            if (labelName) {
              jumpLabel = stackItem.event.labeledSteps[labelName];
              if (!jumpLabel) throw Error("Label '" + labelName + "' not found.");
            }
          }

          if (!jumpLabel) {
            jumpLabel = stackItem.currentStep.getNext(stackItem.stepData)
          }

          stackItem.currentStep = jumpLabel;
          if (stackItem.currentStep) {
            stackItem = this.performStep(stackItem);
          } else {
            this.stack.pop();
            labelName = this.stack[this.stack.length - 1]
            if (labelName) {
              stackItem = labelName;
              stackItem.currentStep = stackItem.currentStep.getNext(stackItem.stepData);
              if (stackItem.currentStep) {
                stackItem = this.performStep(stackItem);
              }
            }
          }
        }

        return !stackItem || !stackItem.currentStep;
      },
    });

    ig.EventRunType = { INTERRUPTABLE: 0, PARALLEL: 1, BLOCKING: 2 };
    ig.EventManager = ig.Class.extend({
      runningEventCalls: [],
      blockingEventCall: null,
      blockedEventCallQueue: [],
      init() {},

      callEvent(event, runType, onStart, onEnd, meta, data) {
        let call = new ig.EventCall(event, meta, runType, onStart, onEnd, data);
        if (!this.blockingEventCall || runType != ig.EventRunType.BLOCKING)
          this._startEventCall(call);
        else {
          call.blocked = true;
          this.blockedEventCallQueue.push(call);
        }
        return call;
      },

      getBlockingEventCall() {
        return this.blockingEventCall;
      },
      hasBlockingEventCallHint(hint) {
        return this.blockingEventCall && this.blockingEventCall.hasHint(hint);
      },
      isInterruptible() {
        for (let call of this.runningEventCalls)
          if (call.runType != ig.EventRunType.INTERRUPTABLE) return false;
        return true;
      },

      update() {
        for (let call of this.runningEventCalls) {
          if (ig.paused && !call.pauseParallel) {
            continue;
          }

          if (call.update()) {
            let i = this.runningEventCalls.indexOf(call);
            this.runningEventCalls.splice(i, 1);
            this._endEventCall(call);
          }
        }
      },
      clearQueue() {
        this.blockedEventCallQueue.length = 0;
      },
      clear() {
        for (let call of this.runningEventCalls) {
          let i = this.runningEventCalls.indexOf(call);
          this.runningEventCalls.splice(i, 1);
          this.blockingEventCall = null;
          this.blockedEventCallQueue = [];
        }
      },
      _startEventCall(call) {
        call.blocked = false;
        this.runningEventCalls.push(call);
        if (call.runType == ig.EventRunType.BLOCKING) this.blockingEventCall = call;
        if (call.onStart) call.onStart(call);
      },
      _endEventCall(call) {
        call.setDone();
        if (call.runType == ig.EventRunType.BLOCKING)
          this.blockedEventCallQueue.length
            ? this._startEventCall(this.blockedEventCallQueue.shift())
            : (this.blockingEventCall = null);
      },
    });

    ig.EventStepBase = ig.StepBase;
    ig.EVENT_STEP = {};
    ig.Event = ig.Class.extend({
      name: null,
      rootStep: null,
      labeledSteps: {},
      hints: [],

      init(meta) {
        this.name = meta.name || '[UNNAMED]';
        this.inputSignature = meta.input || {};
        this.rootStep = ig.StepHelpers.constructSteps(meta.steps, ig.EVENT_STEP, this.labeledSteps);
      },

      addHint(hint) {
        this.hints.push(hint);
      },
      hasHint(hint) {
        return this.hints.indexOf(hint) !== -1;
      },
      clearCached() {
        ig.StepHelpers.clearStepsCache(this.rootStep);
      },

      // I don't really have a var system or anything. We don't need this yet.
      setupInput() {
        return {};
      },
    });
  });

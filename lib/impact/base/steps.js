ig.module('impact.base.steps').defines(() => {
  // TODO: Rewrite to not be abcdefg
  function helper(steps, stepConstructors, labelSteps, needNext) {
    let root,
      childNeedNext = [];

    for (let i in steps) {
      let type = steps[i].type,
        classType = stepConstructors[type];
      if (!classType) continue;

      let step = new classType(steps[i]);

      if (type === 'LABEL') {
        if (labelSteps[step.name] && !window.wm) {
          throw Error(`Step collection includes label '${step.name}' twice`);
        }
        labelSteps[step.name] = step;
      }

      for (let i in childNeedNext) {
        childNeedNext[i]._nextStep = step;
      }
      childNeedNext = [];

      let followUp = step.getBranchNames && step.getBranchNames();
      if (followUp) {
        if (!step.branches) step.branches = {};
        for (let next of followUp) {
          let subSteps = steps[i][next];
          if (!subSteps) {
            subSteps = [];
          }
          step.branches[next] = helper(subSteps, stepConstructors, labelSteps, childNeedNext);
        }
      }
      childNeedNext.push(step);

      if (!root) root = step;
    }

    for (let nn of childNeedNext) {
      needNext.push(nn);
    }

    return root;
  }

  ig.StepHelpers = {
    constructSteps(steps, allSteps, labeledSteps) {
      return helper(steps, allSteps, labeledSteps, []);
    },
    clearStepsCache(step) {
      if (step && !step._cacheIsCleared) {
        step.clearCached && step.clearCached();
        step._cacheIsCleared = true;
        step._nextStep && this.clearStepsCache(step._nextStep);
        if (step.branches) {
          for (let branch of step.branches) this.clearStepsCache(branch);
        }
      }
    },
  };

  ig.StepBase = ig.Class.extend({
    _nextStep: null, // step executed after this step
    _cacheIsCleared: false,
    branches: void 0,
    init() {},

    /**
     * Start the event step
     *
     * @param data Arguments of the event step
     */
    start(data) {},

    /**
     * Run the event step
     *
     * @param data Arguments of the event step
     * @returns {boolean}
     */
    run(data) {
      return true;
    },

    /**
     * Return the step executed after this step
     * This needs to be overridden if the step supports branching
     *
     * @param data Arguments of the event step
     * @returns {} the event step to be executed next
     */
    getNext(data) {
      return this._nextStep;
    },

    /**
     * Implement this callback of the step performs a label jump instead of jumping to the next statement
     *
     * @param data Arguments of the event step
     * @returns {string} The name of the label to jump to
     */
    getJumpLabelName: null,
  });
});

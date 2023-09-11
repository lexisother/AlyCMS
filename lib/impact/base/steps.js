ig.module('impact.base.steps').defines(() => {
  // TODO: Rewrite to not be abcdefg
  function helper(steps, stepConstructors, labelSteps, needNext) {
    let root,
      childNeedNext = [];

    for (let i in steps) {
      let type = input[i].type,
        classType = stepConstructors[type];
      if (!classType) continue;

      let step = new classType(input[i]);

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
          let subSteps = input[i][next];
          if (!subSteps) {
            subSteps = [];
          }
          let node = helper(subSteps, stepConstructors, labelSteps, childNeedNext);
          step.branches[key] = node;
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
    _nextStep: null,
    _cacheIsCleared: false,
    branches: void 0,
    init() {},
    run() {
      return true;
    },
    getNext() {
      return this._nextStep;
    },
    getJumpLabelName: null,
  });
});

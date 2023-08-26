ig.module('base.steps').defines(() => {
  // TODO: Rewrite to not be abcdefg
  function helper(steps, allSteps, labeledSteps, someArr) {
    for (var f = null, g = [], h = 0; h < steps.length; h++) {
      var i = steps[h].type,
        j = allSteps[i];
      if (j) {
        j = new j(steps[h]);
        if (i == 'LABEL') {
          if (labeledSteps[j.name] && !window.wm)
            throw Error("Step Collection includes label '" + j.name + "' twice");
          labeledSteps[j.name] = j;
        }
        for (i = 0; i < g.length; ++i) g[i]._nextStep = j;
        var g = [],
          k = j.getBranchNames && j.getBranchNames();
        if (k) {
          if (!j.branches) j.branches = {};
          for (i = 0; i < k.length; ++i) {
            var l = k[i],
              o = steps[h][l];
            o || (o = []);
            o = helper(o, allSteps, labeledSteps, g);
            j.branches[l] = o;
          }
        }
        g.push(j);
        f || (f = j);
      }
    }
    for (i = 0; i < g.length; ++i) someArr.push(g[i]);
    return f;
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

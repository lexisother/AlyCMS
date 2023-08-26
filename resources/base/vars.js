ig.module("base.vars")
.defines(() => {
    ig.VarCondition = ig.Class.extend({
        condition: null,
        code: "",
        init(cond) {
            this.setCondition(cond);
        },
        setCondition(cond) {
            if (!cond || cond.trim().length === 0) this.code = "true";
            else this.code = cond;
            this.condition = new Function(` return ${this.code}`);
        },
        evaluate() {
            try {
                return !!this.condition.call();
            } catch (_e) {
                console.error(`Condition evaluation failed: ${this.condition}`)
                return false;
            }
        },
        toString() {
            return this.code;
        }
    })
})

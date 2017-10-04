'use strict';

const Util = require('./Util.js');

/**
 * Processors are helper objects that capture the options of the `processors` mechanism
 * for classes.
 *
 * For example:
 *
 *      @define({
 *          processors: [ 'config' ]
 *      })
 *      class Foo extends Base {
 *          static applyConfig () {
 *          }
 *      }
 *
 * Alternatively:
 *
 *      @define({
 *          processors: {
 *              config: 'mixins'
 *
 *              // Equivalent to:
 *              config: {
 *                  after: 'mixins'
 *              }
 *          }
 *      })
 *      class Foo extends Base {
 *          static applyConfig () {
 *          }
 *      }
 */
class Processor {
    constructor (name, options) {
        let cap = Util.capitalize(name);

        this.applier = 'apply' + cap;
        this.name = name;

        if (options) {
            if (typeof options === 'string') {
                this.after = [options];
            }
            else if (Array.isArray(options)) {
                this.after = options;
            }
            else {
                this.after = Util.toArray(options.after) || null;
                this.before = Util.toArray(options.before) || null;
            }
        }
    }

    static decode (inherited, processors) {
        let map = new Util.Empty();
        let ret = [];
        let name;

        if (typeof processors === 'string') {
            processors = [processors];
        }

        if (Array.isArray(processors)) {
            for (name of processors) {
                ret.push(map[name] = new Processor(name));
            }
        }
        else {
            for (name in processors) {
                ret.push(map[name] = new Processor(name, processors[name]));
            }
        }

        if (inherited) {
            for (let proc of inherited) {
                if (!map[name = proc.name]) {
                    ret.push(map[name] = inherited[name].clone());
                }
            }
        }

        return Processor.sort(ret);
    }

    static sort (processors) {
        let state = {
            map: new Util.Empty(),
            path: [],
            stack: new Util.Empty(),
            sorted: []
        };
        let proc;

        for (proc of processors) {
            state.map[proc.name] = proc;
        }

        for (proc of processors) {
            let before = proc.before;

            if (before) {
                proc.before = null;

                for (let b of before) {
                    let bef = state.map[b];
                    let name = proc.name;

                    if (!bef) {
                        Util.raise(`No processor matches "before" ${b} on ${name}`);
                    }

                    (bef.after || (bef.after = [])).push(name);
                }
            }
        }

        for (proc of processors) {
            proc.sort(state);
        }

        return state.sorted;
    }

    clone () {
        let after = this.after;
        let before = this.before;
        let options = after ? { after: after } : null;

        if (before) {
            (options || (options = {})).before = before;
        }

        return new Processor(this.name, options);
    }

    sort (state) {
        if (this.order) {
            return;
        }

        let after = this.after;
        let name = this.name;
        let path = state.path;
        let stack = state.stack;

        path.push(name);

        if (stack[name]) {
            Util.raise(`Circular processor dependencies: ${path.join(" --> ")}`);
        }

        if (after) {
            stack[name] = this;

            for (let a of after) {
                state.map[a].sort(state);
            }

            delete stack[name];
        }

        path.pop();

        state.sorted.push(this);
        this.order = state.sorted.length;
    }
}

Object.assign(Processor.prototype, {
    after: null,
    before: null
});

module.exports = Processor;

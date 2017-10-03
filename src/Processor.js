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
        let ret = new Util.Empty();
        let name;

        if (typeof processors === 'string') {
            processors = [processors];
        }

        if (Array.isArray(processors)) {
            for (name of processors) {
                ret[name] = new Processor(name);
            }
        }
        else {
            for (name in processors) {
                ret[name] = new Processor(name, processors[name]);
            }
        }

        if (inherited) {
            for (name in inherited) {
                if (!ret[name]) {
                    ret[name] = inherited[name].clone();
                }
            }
        }

        Processor.sort(ret);

        return ret;
    }

    static sort (processors) {
        for (let name in processors) {
            let proc = processors[name];
            let before = proc.before;

            if (before) {
                for (let b of before) {
                    let bef = before[b];
                    if (!bef) {
                        Util.raise(`No processor matches "before" ${b} on ${name}`);
                    }

                    (bef.after || (bef.after = [])).push(name);
                }
            }
        }

        let state = {
            all: processors,
            path: [],
            stack: new Util.Set(),
            weight: 0
        };

        for (let name in processors) {
            let proc = processors[name];

            if (!proc.weight) {
                proc.sort(state);
            }
        }
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
        let after = this.after;
        let name = this.name;
        let path = state.path;
        let stack = state.stack;

        if (after) {
            path.push(name);

            if (stack.has(name)) {
                Util.raise(`Circular processor dependencies: ${path.join(" --> ")}`);
            }

            stack.add(name);

            for (let a of after) {
                state.all[a].sort(state);
            }

            path.pop();
            stack.delete(name);
        }

        this.weight = ++state.weight;
    }
}

Object.assign(Processor.prototype, {
    after: null,
    before: null
});

module.exports = Processor;

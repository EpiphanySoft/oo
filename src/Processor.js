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

    static decode (processors, inherited) {
        let map = new Util.Map();

        if (typeof processors === 'string') {
            processors = [processors];
        }

        if (Array.isArray(processors)) {
            for (let name of processors) {
                map.set(name, new Processor(name));
            }
        }
        else {
            for (let name in processors) {
                map.set(name, new Processor(name, processors[name]));
            }
        }

        if (inherited) {
            for (let [name, proc] of inherited) {
                if (!map.has(name)) {
                    map.set(name, proc.clone());
                }
            }
        }

        map.sorted = Processor.sort(map);
        return map;
    }

    static sort (processors) {
        let state = {
            map: processors,
            path: [],
            sorted: []
        };

        for (let proc of processors.values()) {
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

        let names = Array.from(processors.keys());
        names.sort();

        for (let name of names) {
            processors.get(name).sort(state);
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
        if (this.sorted) {
            return;
        }

        let after = this.after;
        let name = this.name;
        let path = state.path;

        path.push(name);

        if (this.sorting) {
            Util.raise(`Circular processor dependencies: ${path.join(" --> ")}`);
        }

        if (after) {
            this.sorting = true;

            for (let a of after) {
                state.map.get(a).sort(state);
            }

            this.sorting = false;
        }

        path.pop();

        state.sorted.push(this);
        this.sorted = true;
    }
}

Object.assign(Processor.prototype, {
    after: null,
    before: null
});

module.exports = Processor;

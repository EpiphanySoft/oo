'use strict';

const { clone, Empty, capitalize, merge, prototype, statics } = require('./Util.js');

const metaSym = Symbol('configMeta');
const initSym = Symbol('configInit');
const openSym = Symbol('configOpen');
const valuesSym = Symbol('configValues');

@statics({
    all: new Empty(),
    symbols: {
        meta: metaSym,
        init: initSym,
        open: openSym,
        values: valuesSym
    }
})
@prototype({
    isConfig: true,
    owner: null,

    cached: false,
    initial: false,
    initialValue: null,
    lazy: false
})
class Config {
    constructor (name) {
        let cap = capitalize(name);

        this.$ = this;

        this.name = name;
        this.applier = 'apply' + cap;
        this.updater = 'update' + cap;
    }

    static addMeta (descriptor, metaName, metaValue) {
        let value = descriptor.initializer();
        let cm = value && value[metaSym];

        if (!cm) {
            value = {
                [metaSym]: cm = {},
                value: value
            };
        }

        cm[metaName] = metaValue;

        descriptor.initializer = () => value;
    }

    static get (name) {
        let all = Config.all;

        return all[name] || (all[name] = new Config(name));
    }

    define (target, init) {
        let def = init ? (this.initDef || this.getInitDef()) : (this.def || this.getDef());

        Object.defineProperty(target, this.name, def);
    }

    extend (options, owner = null) {
        let cfg = this;

        if (!owner || owner !== cfg.owner) {
            cfg = Object.create(cfg);
            cfg.owner = owner;
        }

        Object.assign(cfg, options);

        return cfg;
    }

    merge (value, newValue, target = null, mixinMeta = null) {
        if (mixinMeta) {
            return value;
        }

        if (newValue && newValue.constructor === Object) {
            if (value && value.constructor === Object) {
                newValue = merge(clone(value), newValue);
            }
        }

        return newValue;
    }

    getDef () {
        return this.def || this.$.createDef();
    }

    getInitDef () {
        return this.initDef || this.$.createInitDef();
    }

    //--------------------------------------------------------
    // Private

    createDef () {
        let cfg = this;
        let name = cfg.name;
        let applier = cfg.applier;
        let updater = cfg.updater;

        return cfg.def = {
            get () {
                return this[valuesSym][name];
            },

            set (val) {
                let me = this;
                let values = me[valuesSym];

                if (!me[applier] || (val = me[applier](val, values[name])) !== undefined) {
                    let old = values[name];

                    if (old !== val) {
                        values[name] = val;

                        if (me[updater]) {
                            me[updater](val, old);
                        }
                    }
                }
            }
        };
    }

    createInitDef () {
        const name = this.name;

        return this.initDef = {
            configurable: true,

            get () {
                delete this[name];  // remove the initDef property definition

                // Now that our init def is removed, the following assignment will run
                // the normal def's set() method.

                this[name] = this[initSym][name];  // std setter
                return this[name];  // std getter
            },

            set (v) {
                delete this[name];  // remove the initDef property definition

                this[name] = v;  // std setter
            }
        }
    }
}

module.exports = Config;

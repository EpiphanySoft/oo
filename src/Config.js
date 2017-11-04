'use strict';

const { Empty, capitalize, merge, prototype, statics } = require('./Util.js');

const metaSym = Symbol('configMeta');
const initSym = Symbol('configInit');

@statics({
    all: new Empty(),
    symbols: {
        meta: metaSym,
        init: initSym
    }
})
@prototype({
    isConfig: true,
    owner: null,

    cached: false,
    lazy: false
})
class Config {
    constructor (name) {
        let cap = capitalize(name);

        this.$ = this;
        this.capitalized = cap;
        this.name = name;
        this._name = '_' + name;
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

    define (target) {
        Object.defineProperty(target, this.name, this.def || this.getDef());
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
                newValue = merge({}, value, newValue);
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
                return this.config[name];
            },

            set (value) {
                let me = this;
                let c = me.config;
                let old = c[name];

                if (me[applier]) {
                    value = me[applier](value, old);
                    if (value === undefined) {
                        return;
                    }

                    old = c[name];
                }

                if (old !== value) {
                    c[name] = value;

                    if (me[updater]) {
                        me[updater](value, old);
                    }
                }
            }
        };
    }

    createInitDef () {
        let name = this.name;

        return this.initDef = {
            configurable: true,

            get () {
                delete this[name];
                // Now that our init def is removed, the following assignment will run
                // the normal def's set() method.
                this[name] = this[initSym][name];  // std setter
                return this[name];  // std getter
            },

            set (v) {
                delete this[name];
                this[name] = v;
            }
        }
    }
}

module.exports = Config;

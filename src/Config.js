'use strict';

const { Empty, capitalize, merge, prototype, statics } = require('./Util.js');

@statics({
    all: new Empty(),
    metaSymbol: Symbol('configMeta')
})
@prototype({
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

    static addMeta (instance, name, metaName, metaValue) {
        let value = instance[name];
        let cm = value && value[Config.metaSymbol];

        if (!cm) {
            instance[name] = {
                [Config.metaSymbol]: cm = {},
                value: value
            };
        }

        cm[metaName] = metaValue;
    }

    static get (name) {
        let all = Config.all;

        return all[name] || (all[name] = new Config(name));
    }

    extend (options, owner = null) {
        let c = Object.create(this);

        Object.assign(c, options);

        c.owner = owner;

        return c;
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
        let me = this;
        let _name = me._name;
        let applier = this.applier;
        let updater = this.updater;

        return me.def = {
            get () {
                return this[_name];
            },

            set (value) {
                let me = this;
                let old = me[_name];

                if (me[applier]) {
                    value = me[applier](value, old);
                    if (value === undefined) {
                        return;
                    }

                    old = me[_name];
                }

                if (old !== value) {
                    me[_name] = value;

                    if (me[updater]) {
                        me[updater](value, old);
                    }
                }
            }
        };
    }

    createInitDef () {
        let me = this;
        let name = me.name;

        return this.initDef = {
            configurable: true,

            get () {
                delete this[name];
                this[name] = this.config[name];
                return this[name];
            },

            set (v) {
                delete this[name];
                this[name] = v;
            }
        }
    }
}

Object.assign(Config.prototype, {
    isConfig: true,
    owner: null,

    merge: merge
});

merge.isStdMerge = true;

module.exports = Config;

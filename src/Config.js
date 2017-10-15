'use strict';

const { Empty, capitalize, prototype, statics } = require('./Util.js');

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

    static get (name, options, inherited) {
        let all = Config.all;
        let ret = (inherited && inherited[name]) || all[name];

        if (!ret) {
            all[name] = ret = new Config(name);
        }

        if (options) {
            ret = ret.extend(options);
        }

        return ret;
    }

    extend (options) {
        let c = Object.create(this);

        Object.assign(c, options);

        return c;
    }

    getDef () {
        if (!this.hasOwnProperty('def')) {
            this.createDef();
        }

        return this.def;
    }

    getInitDef () {
        if (!this.hasOwnProperty('initDef')) {
            this.createInitDef();
        }

        return this.initDef;
    }

    getSetter () {
        if (!this.hasOwnProperty('setter')) {
            this.createSetter();
        }

        return this.setter;
    }

    merge () {
        //
    }

    //--------------------------------------------------------
    // Private

    createDef () {
        let me = this;
        let _name = me._name;

        return me.def = {
            get () {
                return this[_name];
            },

            set: me.getSetter()
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

    createSetter () {
        let _name = this._name;
        let applier = this.applier;
        let updater = this.updater;

        let fn = function (value) {
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
        };

        this.setter = fn;
        fn.$cfg = this;

        return fn;
    }
}

module.exports = Config;

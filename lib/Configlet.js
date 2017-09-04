'use strict';

class Configlet {
    constructor (name) {
        let cap = name[0].toUpperCase() + name.substr(1);

        this.capitalized = cap;
        this.name = name;
        this._name = '_' + name;
        this.applier = 'apply' + cap;
        this.updater = 'update' + cap;
    }

    static get (name) {
        let all = Configlet.all;

        return all[name] || (all[name] = new Configlet(name));
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

Configlet.all = {};

module.exports = Configlet;

'use strict';

const Config = require('./Config.js');
const Util = require('./Util.js');
const Empty = Util.Empty;

const chainOwnerSym = Symbol('chainOwner');

let mixinIdSeed = 0;

let getOwnNames = Object.getOwnPropertyNames;
let getOwnSymbols = Object.getOwnPropertySymbols;

let getOwnKeys = getOwnSymbols ? function (object) {
        let keys = getOwnNames(object);
        let syms = getOwnSymbols(object);

        if (keys.length) {
            if (syms.length) {
                keys.push(...syms);
            }
        }
        else {
            keys = syms;
        }

        return keys;
    } : getOwnNames;

function getOwnProps (object) {
    let ret = {
        obj: object,
        keys: getOwnKeys(object),
        props: new Empty(),
        statics: null
    };

    for (let key of ret.keys) {
        ret.props[key] = Object.getOwnPropertyDescriptor(object, key);
    }

    return ret;
}

class Meta {
    constructor (cls, superclass = null) {
        let me = this;
        let proto = cls.prototype;
        let superMeta = superclass && superclass.getMeta();
        let $meta = {
            value: me
        };

        Object.defineProperty(cls, '$meta', $meta);
        Object.defineProperty(proto, '$meta', $meta);

        cls.super = superclass;
        proto.super = superclass && superclass.prototype;

        me.chains = superMeta ? Object.create(superMeta.chains) : new Empty();
        me.liveChains = superMeta ? Object.create(superMeta.liveChains) : new Empty();
        me.id = (cls.name || '') + '$' + ++Meta.count;
        me.bases = superMeta ? superMeta.bases.clone() : new Util.Set();
        me.class = cls;
        me.super = superMeta;

        if (superclass) {
            me.bases.add(superclass);
        }
    }

    complete () {
        let cls = this.class;

        this.completed = true;

        (this.classes = this.bases.clone()).add(cls);

        let sup = this.super;

        if (sup && !sup.completed) {
            sup.complete();
        }
    }

    addChains (...methods) {
        for (let m of methods) {
            this.chains[m] = this.liveChains[m] = true;
        }
    }

    addConfigs (configs) {
        //
    }

    addMixin (mixinMeta, mixinId) {
        if (this.completed) {
            Util.raise(`Too late apply a mixin into this class`);
        }

        mixinMeta.complete();

        let mix = mixinMeta.class;

        this.bases.addAll(mixinMeta.bases).add(mix);

        if (!mixinId) {
            mixinId = mixinMeta.getMixinId();
        }

        if (mixinId) {
            let mixins = this.getMixins();

            if (!mixins[mixinId]) {
                mixins[mixinId] = mix;
                this.class.prototype.mixins[mixinId] = mix.prototype;
            }
        }
    }

    getMembers () {
        if (!this.completed) {
            Util.raise('Class is incomplete');
        }

        let cls = this.class;
        let members = this.members;

        if (!members) {
            this.members = members = getOwnProps(cls.prototype);
            members.statics = getOwnProps(cls);
        }

        return members;
    }

    getMixinId () {
        let mixinId = this.mixinId;
        let cls = this.class;
        let MixinIdSymbol = cls.MixinIdSymbol;

        if (!mixinId) {
            if (cls.hasOwnProperty(MixinIdSymbol)) {
                mixinId = cls[MixinIdSymbol];
            }
            else {
                mixinId = (this.class.name || 'mixin') + '$' + ++mixinIdSeed;
                mixinId = Util.decapitalize(mixinId);
            }

            this.mixinId = mixinId;
        }

        return mixinId;
    }

    getMixins (isStatic) {
        let cls = this.class;
        let proto = cls.prototype;

        if (!cls.hasOwnProperty('mixins')) {
            let sup = this.super;

            cls.mixins = (sup ? Object.create(sup.getMixins(true)) : new Empty());
            proto.mixins = (sup ? Object.create(sup.getMixins()) : new Empty());
        }

        return (isStatic ? cls : proto).mixins;
    }

    getShim (isStatic = true) {
        let shim = this.shim;

        if (!shim) {
            this.shim = shim = this.createShim();
        }

        return isStatic ? shim : shim.prototype;
    }

    invokeMethodChain (instance, reverse, method, args) {
        let liveChains = this.liveChains;

        if (liveChains[method]) {
            let classes = this.classes;
            let called = 0;

            if (reverse) {
                classes = this.classesRev || (this.classesRev = Array.from(classes).reverse());
            }

            for (let cls of classes) {
                let proto = cls.prototype;
                let fn = proto[method];

                if (fn && proto.hasOwnProperty(method)) {
                    ++called;

                    if (args) {
                        fn.apply(instance, args);
                    }
                    else {
                        fn.call(instance);
                    }
                }
            }

            if (!called) {
                liveChains[method] = false;
            }
        }
    }

    //----------------------------------------------------------------------
    // Private

    createShim () {
        let cls = this.class;
        let base = cls.super;

        class Shim extends base {}

        Util.setProto(cls, Shim);
        Util.setProto(cls.prototype, Shim.prototype);

        return Shim;
    }
}

Meta.count = 0;

Object.assign(Meta.prototype, {
    classes: null,
    classesRev: null,
    completed: false,

    instances: 0,

    members: null
});

module.exports = Meta;

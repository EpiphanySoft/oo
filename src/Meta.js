'use strict';

const Configlet = require('./Configlet.js');
const Util = require('./Util.js');

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
        props: new Util.Empty(),
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

        me.id = (cls.name || '') + '$' + ++Meta.count;
        me.bases = superMeta ? superMeta.bases.clone() : new Util.Set();
        me.classes = superMeta ? superMeta.classes.clone() : new Util.Set();
        me.class = cls;
        me.super = superMeta;

        if (superclass) {
            me.bases.add(superclass);
        }

        me.classes.add(cls);
    }

    addConfigs (configs) {
        //
    }

    addMixin (mixinMeta, mixinId) {
        if (!mixinId) {
            mixinId = mixinMeta.getMixinId();
        }

        if (mixinId) {
            let mix = mixinMeta.class;
            let mixins = this.getMixins();

            if (!mixins[mixinId]) {
                mixins[mixinId] = mix;
                this.class.prototype.mixins[mixinId] = mix.prototype;
            }
        }
    }

    init () {
        this.complete = true;
    }

    getMembers () {
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

    getMixins () {
        let pro = this.class.prototype;
        let map = pro.mixins;

        if (!pro.hasOwnProperty('mixins')) {
            this.initMixinsMap();
            map = pro.mixins;
        }

        return map;
    }

    getMixinsStatic () {
        let cls = this.class;
        let map = cls.mixins;

        if (!cls.hasOwnProperty('mixins')) {
            this.initMixinsMap();
            map = cls.mixins;
        }

        return map;
    }

    getShim (isStatic = true) {
        let shim = this.shim;

        if (!shim) {
            this.shim = shim = this.createShim();
        }

        return isStatic ? shim : shim.prototype;
    }

    invalidateMembers () {
        this.members = null;
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

    initMixinsMap () {
        let cls = this.class;
        let sup = this.super;

        cls.mixins = (sup ? Object.create(sup.getMixinsStatic()) : {});
        cls.prototype.mixins = (sup ? Object.create(sup.getMixins()) : {});
    }
}

Meta.count = 0;

Object.assign(Meta.prototype, {
    complete: false,

    instances: 0,

    members: null
});

module.exports = Meta;

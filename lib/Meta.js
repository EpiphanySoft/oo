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

        if (!mixinId) {
            mixinId = this.class.name || ('mixin' + ++mixinIdSeed);
            this.mixinId = mixinId = Util.decapitalize(mixinId);
        }

        return mixinId;
    }

    getMixinsMap () {
        let map = this.mixinsMap;

        if (!map) {
            this.initMixinsMap();
            map = this.mixinsMap;
        }

        return map;
    }

    getMixinsMapStatic () {
        let map = this.mixinsMapStatic;

        if (!map) {
            this.initMixinsMap();
            map = this.mixinsMapStatic;
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
        let sup = this.super;

        this.mixinsMap = (sup ? Object.create(sup.getMixinsMap()) : {});
        this.mixinsMapStatic = (sup ? Object.create(sup.getMixinsMapStatic()) : {});
    }
}

Meta.count = 0;

Object.assign(Meta.prototype, {
    complete: false,

    instances: 0,

    members: null
});

module.exports = Meta;

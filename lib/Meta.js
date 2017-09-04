'use strict';

const Configlet = require('./Configlet.js');
const Util = require('./Util.js');

let mixinIdSeed = 0;

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
        let cls = this.class;
        let proto = cls.prototype;
        let sup = this.super;

        this.complete = true;
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

    initMixinsMap () {
        let sup = this.super;

        this.mixinsMap = (sup ? Object.create(sup.getMixinsMap()) : {});
        this.mixinsMapStatic = (sup ? Object.create(sup.getMixinsMapStatic()) : {});
    }
}

Meta.count = 0;

Object.assign(Meta.prototype, {
    complete: false,

    instances: 0
});

module.exports = Meta;

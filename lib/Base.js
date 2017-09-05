'use strict';

const Meta = require('./Meta.js');
const Util = require('./Util.js');

const JunctionSymbol = Symbol('methodJunction');

class Base {
    static addConfigs (configs) {
        this.getMeta().addConfigs(configs);
    }

    static define (options) {

    }

    static getMeta () {
        let meta = this.$meta;

        if (meta.class !== this) {
            meta = new Meta(this, Object.getPrototypeOf(this));
        }

        return meta;
    }

    constructor (config) {
        let meta = this.$meta;
        let C = this.constructor;

        if (meta.class !== C) {
            meta = C.getMeta();
        }

        if (!meta.instances++) {
            meta.init();
        }

        this.construct();
    }

    construct () {
        //
    }

    destroy () {
        let me = this;
        let meta = me.$meta;

        me.destroy = Util.nullFn;
        me.destroying = true;

        me.destruct();

        me.destroyed = true;
    }

    destruct () {
        //
    }

    getMeta () {
        return this.$meta;
    }

    //-------------------------------------------------------------------------------
    // Private

    static Junction (target, name, descriptor) {
        let fn = descriptor.value;

        if (typeof fn === 'function') {
            fn[JunctionSymbol] = true;
        }
    }

    static createMethodJunction () {
        //
    }

    static mix (mixinCls, mixinId) {
        let meta = this.getMeta(),
            classes = meta.classes,
            mixinMeta = mixinCls.getMeta(),  // ensure all Meta's exist
            beforeCount = classes.size,
            instanceMap = new Util.Empty(),
            staticsMap = new Util.Empty(),
            fn, i, isStatic, k, key, keys, map, members, mixCls, mixMeta, prop, target;

        if (meta.complete) {
            Util.raise(`Too late apply a mixin into this class`);
        }

        if (!mixinId) {
            mixinId = mixinMeta.getMixinId();
        }

        for (mixCls = mixinCls; mixCls !== Base; mixCls = mixCls.super) {
            if (classes.has(mixCls)) {
                break;
            }

            classes.add(mixCls);
            mixMeta = mixCls.$meta; // earlier call to getMeta ensures this is OK
            mixMeta.init();  // mark the class as complete since we cannot update later

            // Start with instance side members:
            isStatic = false;
            map = instanceMap;
            target = this.prototype;

            for (members = mixMeta.getMembers(); members; members = members.statics) {
                keys = members.keys;
                k = keys.length;

                for (i = 0; i < k; ++i) {
                    key = keys[i];
                    if (map[key]) { // TODO filter ctor/dtor et al
                        continue;
                    }

                    map[key] = true;
                    prop = members.props[key];
                    fn = prop.value;
                    fn = (typeof fn === 'function') && fn;

                    if (fn && !fn.$owner) {
                        fn.$owner = mixCls;
                    }

                    if (!(key in target)) {
                        Object.defineProperty(target, key, prop);
                    }
                    else if (fn && typeof target[key] === 'function' &&
                            target.hasOwnProperty(key) &&
                            target[key][JunctionSymbol]) {
                        this.shimMethod(isStatic, key, fn);
                    }
                }

                // Switch over to statics for next loop
                isStatic = true;
                map = staticsMap;
                target = this;
            }

        }

        if (beforeCount !== classes.size) {
            classes.addAll(mixinMeta.classes);
        }

        meta.invalidateMembers();
    }

    static shimMethod (isStatic, key, fn) {
        let target = this;
        let meta = target.$meta;
        let sup = target.super;
        let shim = meta.getShim(isStatic);

        if (!isStatic) {
            sup = sup.prototype;
            target = target.prototype;
        }

    }
}

Base.isClass = true;

Base.prototype.isInstance = true;

new Meta(Base);

module.exports = Base;

'use strict';

const Config = require('./Config.js');
const Processor = require('./Processor.js');
const Util = require('./Util.js');
const Empty = Util.Empty;

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

const JunctionSym = Symbol('junction');

const instanceSkip = new Empty({
    constructor: 1,

    $meta: 1,
    super: 1
});

const staticSkip = new Empty({
    prototype: 1,
    length: 1,
    name: 1,

    $meta: 1,
    super: 1
});

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

        me.id = (cls.name || '') + '$' + ++Meta.count;
        me.class = cls;
        me.super = superMeta;

        cls.super = superclass;
        proto.super = superclass && superclass.prototype;

        if (superclass) {
            me.bases = superMeta.bases.clone();
            me.bases.add(superclass);

            me.configs = Object.create(superMeta.configs);
            me.configValues = Object.create(superMeta.configValues);

            // Since many classes in the hierarchy can *implement* a chained method,
            // we don't try to save on this map creation. This is prototype chained to
            // the superclass's liveChains and only keys with a value of true are put
            // in the map. This ensures that methods in base classes will "activate" a
            // chained method.
            me.liveChains = Object.create(superMeta.liveChains);
            me.rootClass = superMeta.rootClass;
        }
        else {
            me.bases = new Util.Set();

            // Defining new chains is rare so we only create this map for Base. The
            // getChains() method will walk up the supers and return the first class
            // to have defined method chains (which is Base typically).
            me.chains = new Empty();

            me.configs = new Empty(); // configs.title = Config.get('title');
            me.configValues = new Empty();

            me.liveChains = new Empty();
            me.rootClass = cls;
        }
    }

    complete () {
        let cls = this.class;

        this.completed = true;
        this.complete = Util.nullFn;

        (this.classes = this.bases.clone()).add(cls);

        let sup = this.super;

        if (sup && !sup.completed) {
            sup.complete();
        }
    }

    addChains (methods) {
        let chains = this.getChains(true);

        if (!Array.isArray(methods)) {
            methods = [methods];
        }

        for (let m of methods) {
            // Assume all chained methods are live initially. When we first call the
            // chain we check to see if any impls are present and if not we will clear
            // this value.
            this.liveChains[m] = chains[m] = true;
        }
    }

    addConfigs (configs) {
        //
    }

    addMixins (mixinCls, mixinId) {
        let me = this;

        if (!mixinCls) {
            return;
        }
        if (Array.isArray(mixinCls)) {
            for (let mx of mixinCls) {
                if (Array.isArray(mx)) {
                    me.addMixins(mx[1], mx[0]);
                }
                else {
                    me.addMixins(mx);
                }
            }

            return;
        }

        let cls = this.class;
        let prototype = cls.prototype;
        let chains = me.getChains();
        let bases = me.bases;
        let mixinMeta = mixinCls.getMeta();  // ensure all Meta's exist
        let rootClass = me.rootClass;
        let instanceMap = new Empty();
        let staticsMap = new Empty();
        let existing, fn, i, isStatic, k, key, keys, map, members, mixCls,
            mixMeta, prop, skip, target;

        if (cls.constructor.isPrototypeOf(mixinCls)) {
            Util.raise('Cannot mix a derived class into a super class');
        }
        if (!rootClass.isPrototypeOf(mixinCls)) {
            Util.raise(`Mixins must extend base class ${rootClass.name}`);
        }
        if (me.completed) {
            Util.raise(`Too late apply a mixin into this class`);
        }

        mixinMeta.complete();

        mixinId = mixinId || mixinMeta.getMixinId();
        if (mixinId) {
            let mixins = me.getMixins();

            if (!mixins[mixinId]) {
                mixins[mixinId] = mixinCls;
                prototype.mixins[mixinId] = mixinCls.prototype;
            }
        }

        for (mixCls = mixinCls; mixCls !== rootClass; mixCls = mixCls.super) {
            if (bases.has(mixCls)) {
                break;
            }

            mixMeta = mixCls.$meta; // earlier call to getMeta ensures this is OK

            // Start with instance side members:
            isStatic = false;
            map = instanceMap;
            skip = instanceSkip;
            target = prototype;

            for (members = mixMeta.getMembers(); members; members = members.statics) {
                keys = members.keys;
                k = keys.length;

                for (i = 0; i < k; ++i) {
                    if (skip[key = keys[i]]) {
                        continue;
                    }

                    prop = members.props[key];

                    fn = prop.value;
                    fn = (typeof fn === 'function') && fn;
                    if (fn && !fn.$owner) {
                        fn.$owner = mixCls;
                    }

                    if (map[key]) {
                        continue;
                    }
                    map[key] = true;

                    if (!isStatic && chains[key]) {
                        continue;
                    }

                    if (!(key in target)) {
                        Object.defineProperty(target, key, prop);
                    }
                    else if (fn && target.hasOwnProperty(key)) {
                        existing = target[key];
                        if (!existing.$owner) {
                            existing.$owner = cls;
                        }

                        if (existing[JunctionSym] && existing.$owner === cls) {
                            // We could have previously mixed in a method from a class
                            // that was also a Junction, so we need to check that the
                            // method belongs to the target class.
                            if (!existing.fns) {
                                me.createJunction(isStatic, key, existing);
                            }

                            existing.fns.push(fn);
                        }
                    }
                }

                // Switch over to statics for next loop
                isStatic = true;
                map = staticsMap;
                skip = staticSkip;
                target = cls;
            }
        }

        bases.addAll(mixinMeta.bases).add(mixinCls);
    }

    addProcessors (processors) {
        this.processors = Processor.decode(processors, this.getProcessors());
    }

    addProperties (properties) {
        Object.defineProperties(this.class.prototype, properties);
    }

    callChain (instance, method, args = null, reverse = false) {
        let liveChains = this.liveChains;
        let classes = this.classes;
        let called;

        if (!liveChains[method]) {
            return;
        }

        if (reverse) {
            classes = this.classesRev || (this.classesRev = Array.from(classes).reverse());
        }

        for (let cls of classes) {
            let proto = cls.prototype;
            let fn = proto[method];

            if (fn && proto.hasOwnProperty(method)) {
                called = 1;

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

    configure (instance, instanceConfig) {
        //
    }

    getChains (own) {
        let chains = this.chains;

        if (!chains) {
            let sup = this.super;

            if (own) {
                this.chains = chains = Object.create(sup.getChains(true));
            }
            else {
                for (; !chains && sup; sup = sup.super) {
                    chains = sup.chains;
                }
            }
        }

        return chains;
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

        if (mixinId == null) {
            mixinId = this.class.name;
            mixinId = mixinId ? Util.decapitalize(mixinId) : '';

            this.mixinId = mixinId;
        }

        return mixinId;
    }

    getMixins (forPrototype) {
        let cls = this.class;
        let proto = cls.prototype;

        if (!cls.hasOwnProperty('mixins')) {
            let sup = this.super;

            cls.mixins = (sup ? Object.create(sup.getMixins()) : new Empty());
            proto.mixins = (sup ? Object.create(sup.getMixins(true)) : new Empty());
        }

        return (forPrototype ? proto : cls).mixins;
    }

    getProcessors () {
        let ret = null;

        for (let c = this; c && !ret; c = c.super) {
            ret = c.processors;
        }

        return ret;
    }

    getShim (isStatic = true) {
        let shim = this.shim;

        if (!shim) {
            this.shim = shim = this.createShim();
        }

        return isStatic ? shim : shim.prototype;
    }

    processOptions (options) {
        let cls = this.class;
        let processors = options.processors;

        if (processors) {
            delete options.processors;
            cls.applyProcessors(processors);
        }

        processors = cls.getMeta().getProcessors();

        for (let proc of processors) {
            let name = proc.name;

            if (name in options) {
                cls[proc.applier](options[name]);
                delete options[name];
            }
        }

        for (let key in options) {
            let applier = Processor.getApplierName(key);

            if (cls[applier]) {
                cls[applier](options[key]);
            }
            else {
                Util.raise(`Invalid class option: ${key}`);
            }
        }
    }

    reconfigure (instance, instanceConfig) {
        //TODO
    }

    //----------------------------------------------------------------------
    // Private

    static adopt (cls) {
        cls.isClass = true;
        cls.mixins = new Empty();

        cls.prototype.mixins = new Empty();

        Util.copyIf(cls, {
            applyChains (chains) {
                this.getMeta().addChains(chains);
            },

            applyConfig (configs) {
                this.getMeta().addConfigs(configs);
            },

            applyMixinId (mixinId) {
                this.getMeta().mixinId = mixinId;
            },

            applyMixins (mixinCls) {
                this.getMeta().addMixins(mixinCls);
            },

            applyProcessors (processors) {
                this.getMeta().addProcessors(processors);
            },

            applyProperties (properties) {
                this.getMeta().addProperties(properties);
            },

            applyPrototype (members) {
                Object.assign(this.prototype, members);
            },

            applyStatic (members) {
                Object.assign(this, members);
            },

            define (options) {
                this.getMeta().processOptions(options);
                return this;
            },

            getMeta () {
                let meta = this.$meta;
                if (meta.class !== this) {
                    meta = new Meta(this, Object.getPrototypeOf(this));
                }

                return meta;
            }
        });

        return new Meta(cls);
    }

    createJunction (isStatic, key, method) {
        let shim = this.getShim(isStatic);
        let sup = this.class.super;

        if (!isStatic) {
            sup = sup.prototype;
        }

        method.fns = [];

        // A junction calls the true super method and all applyMixins methods and
        // returns the return value of the first method called.
        shim[key] = method[JunctionSym] = function (...args) {
            let called = sup[key];
            let result = called && called.apply(this, args);
            let res;

            for (let fn of method.fns) {
                res = fn.apply(this, args);

                if (!called) {
                    called = true;
                    result = res;
                }
            }

            return result;
        };
    }

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

Meta.symbols = {
    junction: JunctionSym
};

Object.assign(Meta.prototype, {
    chains: null,
    classes: null,
    classesRev: null,
    completed: false,

    instances: 0,

    members: null
});

module.exports = Meta;

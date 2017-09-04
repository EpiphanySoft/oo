'use strict';

const Configlet = require('./Configlet.js');
const Util = require('./Util.js');

let mixinIdSeed = 0;
let idSeed = 0;

class Meta {
    constructor (cls, superclass = null) {
        let proto = cls.prototype;
        let $meta = {
            value: this
        };

        Object.defineProperty(cls, '$meta', $meta);
        Object.defineProperty(proto, '$meta', $meta);

        cls.super = superclass;
        proto.super = superclass && superclass.prototype;

        this.id = ++idSeed;
        this.classes = new Util.Empty();
        this.cls = cls;
        this.super = superclass && superclass.getMeta();
    }

    addConfigs (configs) {
        //
    }

    init () {
        let cls = this.cls;
        let proto = cls.prototype;
        let sup = this.super;

        this.complete = true;
    }

    getMixinId () {
        let mixinId = this.mixinId;

        if (!mixinId) {
            mixinId = this.cls.name || ('mixin' + ++mixinIdSeed);
            this.mixinId = mixinId = Util.decapitalize(mixinId);
        }

        return mixinId;
    }
}

Object.assign(Meta.prototype, {
    complete: false,

    instances: 0
});

module.exports = Meta;

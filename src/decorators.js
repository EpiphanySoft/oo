'use strict';

const Base = require('./Base.js');
const symbols = Base.symbols;

module.exports = {
    chains (...methods) {
        return C => {
            C.getMeta().addChains(...methods);
        };
    },

    mixinId (mixinId) {
        return C => {
            C[symbols.mixinId] = mixinId;
        }
    },

    /**
     * This decorator is applied to class methods that have multiple base class and/or
     * mixin "super" methods.
     *
     * For example:
     *
     *      class Foo extends Base {
     *          @junction
     *          bar (x, y) {
     *              super.bar(x, y);
     *          }
     *      }
    */
    junction (targetCls, name, descriptor) {
        let fn = descriptor.value;

        if (typeof fn === 'function') {
            fn[symbols.junction] = true;
        }
    }
};

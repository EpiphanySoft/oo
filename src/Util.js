'use strict';

// https://jsperf.com/object-create-null-vs-new-empty-prototype

function Empty (src) {
    if (src) {
        Object.assign(this, src);
    }
}

// For sanity (not safe to drop this one out):
Object.defineProperty(Empty.prototype = Object.create(null), 'hasOwnProperty', {
    value: Object.prototype.hasOwnProperty
});

// class MySet extends Set {
//     constructor () {
//         super();
//     }
//
//     addAll (src) {
//         for (let v of src) {
//             this.add(v);
//         }
//
//         return this;
//     }
//
//     clone () {
//         let ret = new MySet();
//
//         return ret.addAll(this);
//     }
// }

(function (MapProto) {
    if (!MapProto.addAll) {
        MapProto.addAll = function (src) {
            for (let [key, value] of src) {
                this.add(key, value);
            }

            return this;
        }
    }

    if (!MapProto.clone) {
        MapProto.clone = function () {
            let ret = new Map();
            ret.addAll(this);
            return ret;
        }
    }
}(Map.prototype));

(function (SetProto) {
    if (!SetProto.addAll) {
        SetProto.addAll = function (src) {
            for (let v of src) {
                this.add(v);
            }

            return this;
        }
    }

    if (!SetProto.clone) {
        SetProto.clone = function () {
            let ret = new Set();
            ret.addAll(this);
            return ret;
        }
    }
}(Set.prototype));

const Util = {
    nullFn () {},

    Empty: Empty,
    Map: Map,
    Set: Set,

    capitalize (str) {
        return str ? str[0].toUpperCase() + str.substr(1) : '';
    },

    decapitalize (str) {
        return str ? str[0].toLowerCase() + str.substr(1) : '';
    },

    raise (msg) {
        throw new Error(msg);
    },

    setProto: Object.setPrototypeOf || (function () {
            let base = { works: 1 };
            let extended = {};

            extended.__proto__ = base;

            if (!extended.works) {
                return function () {
                    Util.raise(`Cannot polyfill setPrototypeOf`);
                };
            }

            return function (object, prototype) {
                object.__proto__ = prototype;
            };
        }()),

    toArray (src) {
        if (src && !Array.isArray(src)) {
            src = [src];
        }
        return src;
    }
};

module.exports = Util;

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

class MyMap extends Map {
    addAll (src) {
        for (let [key, value] of src) {
            this.add(key, value);
        }

        return this;
    }

    clone () {
        let ret = new MyMap();
        ret.addAll(this);
        return ret;
    }
}

class MySet extends Set {
    constructor () {
        super();
    }

    addAll (src) {
        for (let v of src) {
            this.add(v);
        }

        return this;
    }

    clone () {
        let ret = new MySet();

        return ret.addAll(this);
    }
}

const Util = {
    nullFn () {},

    Empty: Empty,
    Map: MyMap,
    Set: MySet,

    copy (dest, ...sources) {
        if (dest) {
            for (let src of sources) {
                if (src) {
                    for (let key in src) {
                        dest[key] = src[key];
                    }
                }
            }
        }

        return dest;
    },

    copyIf (dest, ...sources) {
        if (dest) {
            for (let src of sources) {
                if (src) {
                    for (let key in src) {
                        if (!(key in dest)) {
                            dest[key] = src[key];
                        }
                    }
                }
            }
        }

        return dest;
    },

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

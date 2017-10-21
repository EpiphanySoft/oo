'use strict';

const toString = Object.prototype.toString;

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
        return new MyMap().addAll(this);
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
        return new MySet().addAll(this);
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

    clone (object) {
        let i, clone = object;

        if (object) {
            let type = Util.typeOf(object);

            if (type === 'array') {
                clone = [];

                for (i = object.length; i-- > 0; ) {
                    clone[i] = Util.clone(object[i]);
                }
            }
            else if (type === 'date') {
                clone = new Date(+object);
            }
            else if (type === 'object' && object.constructor === Object) {
                clone = {};

                for (i in object) {
                    clone[i] = Util.clone(object[i]);
                }
            }
        }

        return clone;
    },

    merge (target, ...sources) {
        if (target) {
            let key, targetValue, value;

            for (let src of sources) {
                if (src) {
                    for (key in src) {
                        value = src[key];
                        targetValue = target[src];

                        if (value && targetValue &&
                                value.constructor === Object &&
                                targetValue.constructor === Object) {
                            Util.merge(targetValue, value);
                        }
                        else {
                            target[key] = Util.clone(value);
                        }
                    }
                }
            }
        }

        return target;
    },

    raise (msg) {
        throw new Error(msg);
    },

    prototype (members) {
        return C => {
            Object.assign(C.prototype, members);
        }
    },

    statics (members) {
        return C => {
            Object.assign(C, members);
        }
    },

    typeOf (value) {
        if (value === null) {
            return 'null';
        }

        let type = typeof value;
        let typeOf = Util.typeOf;

        if (!typeOf.simpletons[type]) {
            // map s="[object Date]" to type="date"
            let s = toString.call(value);
            let cache = typeOf.cache;

            if (!(type = cache[s])) {
                let m = typeOf.parseRe.exec(s);

                cache[s] = type = m ? m[1].toLowerCase() : s;
            }
        }

        return type;
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

Object.assign(Util.typeOf, {
    cache: new Empty(),
    parseRe: /^\[object ([^\]]+)]$/,
    simpletons: {
        boolean: 1,
        number: 1,
        string: 1,
        undefined: 1
    }
});

module.exports = Util;

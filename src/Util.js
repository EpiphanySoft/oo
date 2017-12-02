'use strict';

const getOwnNames = Object.getOwnPropertyNames;
const getOwnSymbols = Object.getOwnPropertySymbols;
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
    EMPTY: Object.freeze([]),
    Set: MySet,

    capitalize (str) {
        return str ? str[0].toUpperCase() + str.substr(1) : '';
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

    getAllKeys (object) {
        let keys = [];

        for (let key in object) {
            keys.push(key);
        }

        return keys;
    },

    getOwnKeys: getOwnNames,

    merge (target, ...sources) {
        if (target) {
            let key, targetValue, value;

            for (let src of sources) {
                if (src) {
                    for (key in src) {
                        value = src[key];
                        targetValue = target[key];

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

    prototype (members) {
        return C => {
            Object.assign(C.prototype, members);
        }
    },

    raise (msg) {
        throw new Error(msg);
    },

    statics (members) {
        return C => {
            Object.assign(C, members);
        }
    },

    toArray (src) {
        if (src && !Array.isArray(src)) {
            src = [src];
        }
        return src;
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
    }
};

if (getOwnSymbols) {
    Util.getOwnKeys = function (object) {
        let keys = getOwnNames(object);
        let symbols = getOwnSymbols(object);

        if (keys.length) {
            if (symbols.length) {
                keys.push(...symbols);
            }
        }
        else {
            keys = symbols;
        }

        return keys;
    };
}

Util.setProto = Util.noSetProto = function () {
    Util.raise(`Cannot polyfill setPrototypeOf`);
};

Util.setProto__ = function (object, prototype) {
    object.__proto__ = prototype;
};

let base = { works: 1 };
let pr = {};
pr.__proto__ = base;

Util.setProto = Object.setPrototypeOf || (pr.works && Util.setProto__) || Util.setProto;

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

'use strict';

// https://jsperf.com/object-create-null-vs-new-empty-prototype

function Empty () {
    // nada
}

const pr = Empty.prototype = Object.create(null);

// For sanity (not safe to drop this one out):
pr.hasOwnProperty = Object.prototype.hasOwnProperty;

class MySet extends Set {
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

function getSetPrototypePolyfill () {
    let base = { abc: 1 };
    let extended = {};

    extended.__proto__ = base;

    if (extended.abc) {
        return function (object, prototype) {
            object.__proto__ = prototype;
        };
    }

    return function () {
        Util.raise(`Cannot polyfill setPrototypeOf`);
    };
}

const Util = {
    nullFn () {},

    Empty: Empty,
    Set: MySet,

    capitalize (str) {
        return str ? str[0].toUpperCase() + str.substr(1) : '';
    },

    decapitalize (str) {
        return str ? str[0].toLowerCase() + str.substr(1) : '';
    },

    raise (msg) {
        throw new Error(msg);
    },

    setProto: Object.setPrototypeOf || getSetPrototypePolyfill()
};

module.exports = Util;

'use strict';

// https://jsperf.com/object-create-null-vs-new-empty-prototype

function Empty () {
    // nada
}

const pr = Empty.prototype = Object.create(null);

// For sanity (not safe to drop this one out):
pr.hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = {
    nullFn () {},

    Empty: Empty,

    capitalize (str) {
        return str ? str[0].toUpperCase() + str.substr(1) : '';
    },

    decapitalize (str) {
        return str ? str[0].toLowerCase() + str.substr(1) : '';
    }
};

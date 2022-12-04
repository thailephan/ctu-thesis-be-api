const debug = require("./debugger");
const config = require("../config");
const getLog = ({
                    type, errorMessage, request, executedFunction, data
                }) => {
    return {
        executedFunction,
        type, error: { message: errorMessage, }, request, header: { }, data
    }
}
const Helpers = {
    extractSort(sortStr) {
        if (Helpers.isNullOrEmpty(sortStr)) {
            return null;
        } else {
            return sortStr.split("|").map(s => s.at(0) === "-" ? `${s.slice(1)} DESC` : `${s} ASC`).join(", ");
        }
    },
    /**
     * Check value is string or non.
     *
     * @param {any} value: The value to be tested.
     * @returns {boolean} If data type is string true. Otherwise it returns false.
     */
    isString: (value) => {
        return typeof value === "string";
    },

    /**
     * Check value is object or non.
     *
     * @param {any} value: The value to be tested.
     * @returns {boolean} If data type is object true. Otherwise it returns false.
     */
    isObject: (value) => {
        return typeof value === "object";
    },

    /**
     * Determine if the argument passed is a JavaScript function object.
     *
     * @param {any} obj: Object to test whether or not it is an array.
     * @returns {boolean} returns a Boolean indicating whether the object is a JavaScript function
     */
    isFunction: (value) => {
        return typeof value === "function";
    },

    /**
     * Check a value is number or non, if number then return true, otherwise return false.
     *
     * @param {string} value: Value can check number
     * @returns {boolean} if number then return true, otherwise return false.
     */
    isNumber: (value) => {
        return typeof value === "number";
    },

    /**
     * Check Object is null or String null or empty.
     *
     * @param {object | string} value Object or String
     * @returns {boolean} if null or empty return true, otherwise return false.
     */
    isNullOrEmpty: (value) => {
        return value === undefined || value === null || value === "";
    },
    isEmail: (input) => {
        return String(input)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    },
    isPhoneNumber: (input) => {
       return String(input).toLowerCase().match(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[\./0-9]*$/i);
    },
    getLog,
    getKafkaLog: ({messages, key = config.settings.logMessageKey, topic = config.settings.logTopic}) => {
        return {
            topic,
            messages: messages.map(m => ({
                key: m.key || key || undefined,
                value: JSON.stringify({...messages, loggerId: config.settings.clientId})
            }))
        }
    },
    randomString: (size = 8) => {
        return require("crypto").randomBytes(size).toString("hex");
    },
}

module.exports = Helpers;
export {};
require("dotenv").config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ITokenPayload } from "./interface";

const debug = require("../common/debugger");
const config = require("../config");

const Helpers = {
    pageToOffsetLimit(input: {page: number | null, size: number | null}) {
        const {page, size} = input;

        if (size > 0) {
            return {
                offset: (page - 1) * size,
                limit: size,
            }
        }

        return {
            offset: undefined,
            limit: undefined
        }
    },
    extractSort(sortStr?: string) {
        if (Helpers.isNullOrEmpty(sortStr)) {
            return null;
        } else {
            return sortStr.split("|").map(s => s.at(0) === "-" ? `${s.slice(1)} DESC` : `${s} ASC`).join(", ");
        }
    },
    hash(input: string) {
        return bcrypt.hash(input, 10).then(function(hash) {
            debug.debugger("helpers: hash: success", {hash});
            return hash;
        }).catch(err => {
            debug.debugger("helpers: hash: failed", {err});
            return null;
        });
    },
    // JWT
    generateToken(payload: ITokenPayload) {
        return jwt.sign(payload, config.token.access_token_secret, { subject: payload.username });
    },
    /**
     * Check value is string or non.
     *
     * @param {any} value: The value to be tested.
     * @returns {boolean} If data type is string true. Otherwise it returns false.
     */
    isString: (value: any): value is string => {
        return typeof value === "string";
    },

    /**
     * Check value is object or non.
     *
     * @param {any} value: The value to be tested.
     * @returns {boolean} If data type is object true. Otherwise it returns false.
     */
    isObject: (value: any): value is object => {
        return typeof value === "object";
    },

    /**
     * Determine if the argument passed is a JavaScript function object.
     *
     * @param {any} obj: Object to test whether or not it is an array.
     * @returns {boolean} returns a Boolean indicating whether the object is a JavaScript function
     */
    isFunction: (value: any): value is (...args: any) => void => {
        return typeof value === "function";
    },

    /**
     * Check a value is number or non, if number then return true, otherwise return false.
     *
     * @param {string} value: Value can check number
     * @returns {boolean} if number then return true, otherwise return false.
     */
    isNumber: (value: any): value is number => {
        return typeof value === "number";
    },

    /**
     * Check Object is null or String null or empty.
     *
     * @param {object | string} value Object or String
     * @returns {boolean} if null or empty return true, otherwise return false.
     */
    isNullOrEmpty: (value: any): value is undefined | boolean => {
        return value === undefined || value === null || value === "";
    },
    isEmail: (input: any) => {
        return String(input)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    },
    isPhoneNumber: (input: any) => {
       return String(input).toLowerCase().match(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[\./0-9]*$/i);
    }
}

module.exports = Helpers;
"use strict";
////////////////////////////////////////////////////////////////////
//
// GENERATED CLASS
//
// DO NOT EDIT
//
// See sequelize-auto-ts for edits
//
////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Sequelize = sequelize_1.default;
/*__ignore__*/ let __defineFieldType__;
/*__ignore__*/ let __associationNameQuoted__;
class Models {
    constructor(database, username, password, options) {
        this.SEQUELIZE = new Sequelize(database, username, password, options);
        const self = this;
        /*__startEach__ tables */
        this.__tableNameCamel__ = this.__tableName__ = this.SEQUELIZE.define('__tableNameSingular__', {
            /*__each__ realDbFields, */ '__fieldName__': __defineFieldType__
        }, {
            timestamps: false,
            classMethods: {}
        });
        /*__endEach__*/
        /*__startEach__ references */
        this.__primaryTableNameCamel__.hasMany(this.__foreignTableNameCamel__, { foreignKey: '__foreignKey__' });
        this.__foreignTableNameCamel__.belongsTo(this.__primaryTableNameCamel__, {
            as: __associationNameQuoted__,
            foreignKey: '__foreignKey__'
        });
        /*__endEach__*/
        /*__startEach__ xrefs */
        this.__firstTableNameCamel__.belongsToMany(this.__secondTableNameCamel__, { through: '__xrefTableName__' });
        this.__secondTableNameCamel__.belongsToMany(this.__firstTableNameCamel__, { through: '__xrefTableName__' });
        /*__endEach__*/
    }
}
exports.Models = Models;
let modelsCache = {};
function forDatabase(database, username, password, options) {
    let cache = modelsCache[database];
    if (cache !== undefined) {
        cache.lastRetrieved = new Date();
        return cache.models;
    }
    if (typeof username !== 'string' || username.length === 0 ||
        typeof password !== 'string' || password.length === 0) {
        throw new Error('Cannot get models for database "' + database + '" since username and/or password were not ' +
            'provided and the database is not yet cached. forDatabase() must be called first with authentication ' +
            'data before it can be called with only the database name.');
    }
    cache = {
        models: new Models(database, username, password, options),
        lastRetrieved: new Date()
    };
    modelsCache[database] = cache;
    return cache.models;
}
exports.forDatabase = forDatabase;
function clearAll() {
    modelsCache = {};
}
exports.clearAll = clearAll;
function clearDatabase(database) {
    delete modelsCache[database];
}
exports.clearDatabase = clearDatabase;
function clearNotUsedSince(date) {
    const time = date.getTime();
    const allKeys = Object.keys(modelsCache);
    const clearKeys = allKeys.filter(key => modelsCache[key].lastRetrieved.getTime() < time);
    if (clearKeys.length === 0) {
        return;
    }
    if (clearKeys.length === allKeys.length) {
        clearAll();
        return;
    }
    clearKeys.forEach(key => clearDatabase(key));
}
exports.clearNotUsedSince = clearNotUsedSince;
//# sourceMappingURL=sequelize-model-factory.js.map
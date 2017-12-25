////////////////////////////////////////////////////////////////////
//
// GENERATED CLASS
//
// DO NOT EDIT
//
// See sequelize-auto-ts for edits
//
////////////////////////////////////////////////////////////////////
"use strict";
const Sequelize = require('sequelize');
const cls = require('continuation-local-storage');
const djatyNS = cls.createNamespace('djaty-cls-djatyNS');
const patchIt = require('cls-domains-promise');
patchIt(djatyNS, Promise.prototype);
/* __each__ momentJsImport */ const __name__ = require('__name__');
exports.initialized = false;
/*__ignore__*/ let __defineFieldType__;
/*__ignore__*/ let __primaryTableNameCamel__;
/*__ignore__*/ let __foreignTableNameCamel__;
/*__ignore__*/ let __firstTableName__;
/*__ignore__*/ let __secondTableName__;
/*__ignore__*/ let __associationNameQuoted__;
/*__ignore__*/ let __foreignTableNameRealCamel__;
function initialize(database, username, password, options) {
    if (exports.initialized) {
        return exports.models;
    }
    exports.initialized = true;
    Sequelize.useCLS(djatyNS);
    exports.SEQUELIZE = new Sequelize(database, username, password, options);
    /*__startEach__ tables */
    exports.__tableNameCamel__ = exports.SEQUELIZE.define('__tableName__', {
        /*__each__ realDbFields, */ '__fieldName__': __defineFieldType__
    }, {
        timestamps: false,
        freezeTableName: true,
        classMethods: {}
    });
    /*__endEach__*/
    /*__startEach__ references */
    __primaryTableNameCamel__.hasMany(__foreignTableNameCamel__, { as: '__antiCollisionAssociationNameCamel__', foreignKey: '__foreignKey__' });
    __foreignTableNameCamel__.belongsTo(__primaryTableNameCamel__, { as: __associationNameQuoted__, foreignKey: '__foreignKey__' });
    /*__endEach__*/
    /*__startEach__ xrefs */
    __firstTableName__.belongsToMany(__secondTableName__, { through: '__xrefTableName__' });
    __secondTableName__.belongsToMany(__firstTableName__, { through: '__xrefTableName__' });
    /*__endEach__*/
    return exports;
}
exports.initialize = initialize;
//# sourceMappingURL=sequelize-models.js.map
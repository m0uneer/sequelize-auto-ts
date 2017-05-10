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
const sequelize_1 = require('sequelize');
/* __each__ momentJsImport */ const __name__ = require('__name__');
const Sequelize = sequelize_1.default;
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
    exports.SEQUELIZE = new Sequelize(database, username, password, options);
    /*__startEach__ tables */
    exports.__tableNameCamel__ = exports.SEQUELIZE.define('__tableName__', {
        /*__each__ realDbFields, */ '__fieldName__': __defineFieldType__
    }, {
        timestamps: false,
        freezeTableName: true,
        classMethods: {
            get__tableNameSingular__: (__tableNameSingular__) => {
                const where = {};
                const id = parseInt(__tableNameSingular__);
                if (isNaN(id)) {
                    /*__each__ realDbFields */ if (__tableNameSingular__['__fieldName__'] !== undefined) {
                        where['__fieldName__'] = __tableNameSingular__['__fieldName__'];
                    }
                }
                else {
                    where['__idFieldName__'] = id;
                }
                return exports.__tableNameCamel__.find({ where: where });
            }
        }
    });
    /*__endEach__*/
    /*__startEach__ references */
    __primaryTableNameCamel__.hasMany(__foreignTableNameCamel__, { as: '__foreignTableNameRealCamel__', foreignKey: '__foreignKey__' });
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
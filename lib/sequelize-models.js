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
const sequelize_1 = require("sequelize");
const Sequelize = sequelize_1.default;
exports.initialized = false;
/*__ignore__*/ let __defineFieldType__;
/*__ignore__*/ let __primaryTableName__;
/*__ignore__*/ let __foreignTableName__;
/*__ignore__*/ let __firstTableName__;
/*__ignore__*/ let __secondTableName__;
/*__ignore__*/ let __associationNameQuoted__;
function initialize(database, username, password, options) {
    if (exports.initialized) {
        return exports.models;
    }
    exports.initialized = true;
    exports.SEQUELIZE = new Sequelize(database, username, password, options);
    /*__startEach__ tables */
    exports.__tableName__ = exports.SEQUELIZE.define('__tableNameSingular__', {
        /*__each__ realDbFields, */ '__fieldName__': __defineFieldType__
    }, {
        timestamps: false,
        freezeTableName: true,
        classMethods: {
            get__tableNameSingular__: (__tableNameSingularCamel__) => {
                const where = {};
                const id = parseInt(__tableNameSingularCamel__);
                if (isNaN(id)) {
                    /*__each__ realDbFields */ if (__tableNameSingularCamel__['__fieldName__'] !== undefined) {
                        where['__fieldName__'] = __tableNameSingularCamel__['__fieldName__'];
                    }
                }
                else {
                    where['__idFieldName__'] = id;
                }
                return exports.__tableName__.find({ where: where });
            }
        }
    });
    /*__endEach__*/
    /*__startEach__ references */
    __primaryTableName__.hasMany(__foreignTableName__, { foreignKey: '__foreignKey__' });
    __foreignTableName__.belongsTo(__primaryTableName__, { as: __associationNameQuoted__, foreignKey: '__foreignKey__' });
    /*__endEach__*/
    /*__startEach__ xrefs */
    __firstTableName__.belongsToMany(__secondTableName__, { through: '__xrefTableName__' });
    __secondTableName__.belongsToMany(__firstTableName__, { through: '__xrefTableName__' });
    /*__endEach__*/
    return exports;
}
exports.initialize = initialize;
//# sourceMappingURL=sequelize-models.js.map
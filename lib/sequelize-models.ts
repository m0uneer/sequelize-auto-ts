////////////////////////////////////////////////////////////////////
//
// GENERATED CLASS
//
// DO NOT EDIT
//
// See sequelize-auto-ts for edits
//
////////////////////////////////////////////////////////////////////

import sequelize from 'sequelize';

import types = require('./sequelize-types');

const Sequelize:sequelize.SequelizeStatic = sequelize;

export let initialized:boolean = false;
export let models:types.GeneratedModels;

export let SEQUELIZE:sequelize.Sequelize;

/*__each__ tables */ export let __tableNameCamel__:types.__tableNameSingular__Model;

/*__ignore__*/ let __defineFieldType__;
/*__ignore__*/ let __primaryTableNameCamel__:sequelize.Model<any, any>;
/*__ignore__*/ let __foreignTableNameCamel__:sequelize.Model<any, any>;
/*__ignore__*/ let __firstTableName__:sequelize.Model<any, any>;
/*__ignore__*/ let __secondTableName__:sequelize.Model<any, any>;
/*__ignore__*/ let __associationNameQuoted__:string;

export function initialize(database:string, username:string, password:string, options:sequelize.Options):types.GeneratedModels
{
    if (initialized)
    {
        return models;
    }

    initialized = true;

    SEQUELIZE = new Sequelize(database, username, password, options);

    /*__startEach__ tables */

    __tableNameCamel__ = <types.__tableNameSingular__Model> SEQUELIZE.define<types.__tableNameSingular__Instance, types.__tableNameSingular__Pojo>('__tableName__', {
        /*__each__ realDbFields, */'__fieldName__':__defineFieldType__
        },
        {
            timestamps: false,
            freezeTableName: true,
            classMethods: {
                get__tableNameSingular__:(__tableNameSingular__:any) => {
                    const where:{[key:string]:any} = {};
                    const id:number = parseInt(__tableNameSingular__);
                    if (isNaN(id)) {
                        /*__each__ realDbFields */ if (__tableNameSingular__['__fieldName__'] !== undefined) { where['__fieldName__'] = __tableNameSingular__['__fieldName__']}
                    } else {
                        where['__idFieldName__'] = id;
                    }
                    return __tableNameCamel__.find({where: where});
                }
            }
        });
    /*__endEach__*/

    /*__startEach__ references */

    __primaryTableNameCamel__.hasMany(__foreignTableNameCamel__, {foreignKey: '__foreignKey__' });
    __foreignTableNameCamel__.belongsTo(__primaryTableNameCamel__, {as: __associationNameQuoted__, foreignKey: '__foreignKey__' });

    /*__endEach__*/

    /*__startEach__ xrefs */

    __firstTableName__.belongsToMany(__secondTableName__, { through: '__xrefTableName__'});
    __secondTableName__.belongsToMany(__firstTableName__, { through: '__xrefTableName__'});

    /*__endEach__*/

    return exports;
}


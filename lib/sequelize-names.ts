////////////////////////////////////////////////////////////////////
//
// GENERATED CLASS
//
// DO NOT EDIT
//
// See sequelize-auto-ts for edits
//
////////////////////////////////////////////////////////////////////

import types = require('./sequelize-types');

export interface SequelizeNames {
    TableNames: TableNames;
    calculatedFields:CalculatedFields;
    references:References;
    /*__each__ tables */ __tableNameSingularCamel__Fields:__tableNameUpperCase__Fields;
}

export class TableNames {
    /*__each__ tables */ __tableNameModel__:string = '__tableName__';
}
export var tableNames:TableNames = new TableNames();

/*__startEach__ tables */

export class __tableNameUpperCase__Fields {
    /*__each__ fields */ __fieldName__:string = '__fieldName__';
}
export var __tableNameSingularCamel__Fields:__tableNameUpperCase__Fields = new __tableNameUpperCase__Fields();

/*__endEach__*/

export class CalculatedFields {
    /*__each__ calculatedFields */ __fieldName__:string = '__fieldName__';
}
export var calculatedFields:CalculatedFields = new CalculatedFields();

/*__ignore__*/ var __associationNameQuoted__:string;
export class References {
    /*__each__uniqueReferences */ __foreignKey__:types.Reference = { tableName: '__primaryTableNameModel__', primaryKey: '__primaryKey__', foreignKey: '__foreignKey__', as: __associationNameQuoted__};
}

export var references:References = new References();

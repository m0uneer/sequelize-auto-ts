/****************************
 *
 * Loads and exposes schema from database
 * @TODO Remove this redundancy: keep only camelCase attrs
 * {"issues": [{"createdBy": 1,"assignedTo": 1, "created_by": 1,"assigned_to": 1}]}
*/

import sequelize from 'sequelize';
import * as _ from 'lodash';

import util = require('./util');

const Sequelize:sequelize.SequelizeStatic = sequelize;

export class Schema {

    public static idSuffix:string = "id"; // NOTE: Must be LOWER case
    public static dbNameCase:string = "snake";

    public references:Reference[] = [];
    public xrefs:Xref[] = [];
    public associations:Association[] = [];
    public calculatedFields:Array<Field> = [];
    public views:Table[] = [];
    public idFields:Field[] = [];
    public idFieldLookup:util.Dictionary<boolean> = {};

    public useModelFactory:boolean = false;

    constructor(public tables:Array<Table>)
    {

    }

    public static fieldTypeTranslations:util.Dictionary<string> = {

        tinyint: "boolean",

        smallint: "number",
        int: "number",
        integer: "number",
        mediumint: "number",
        bigint: "number",
        year: "number",
        float: "number",
        double: "number",
        decimal: "number",

        timestamp: "Date",
        date: "Date",
        datetime: "Date",

        tinyblob: "Buffer",
        mediumblob: "Buffer",
        longblob: "Buffer",
        blob: "Buffer",
        binary: "Buffer",
        varbinary: "Buffer",
        bit: "Buffer",

        char: "string",
        varchar: "string",
        tinytext: "string",
        mediumtext: "string",
        longtext: "string",
        text: "string",
        "enum": "string",
        "set": "string",
        time: "string",
        geometry: "string"
    };

    public static fieldTypeSequelize:util.Dictionary<string> = {

        tinyint: 'Sequelize.INTEGER',
        smallint: 'Sequelize.INTEGER',
        int: 'Sequelize.INTEGER',
        integer: 'Sequelize.INTEGER',
        mediumint: 'Sequelize.INTEGER',
        bigint: 'Sequelize.INTEGER',
        year: 'Sequelize.INTEGER',

        float: 'Sequelize.DECIMAL',
        double: 'Sequelize.DECIMAL',
        decimal: 'Sequelize.DECIMAL',

        timestamp: 'Sequelize.DATE',
        date: 'Sequelize.DATE',
        datetime: 'Sequelize.DATE',

        tinyblob: 'Sequelize.BLOB',
        mediumblob: 'Sequelize.BLOB',
        longblob: 'Sequelize.BLOB',
        blob: 'Sequelize.BLOB',
        binary: 'Sequelize.BLOB',
        varbinary: 'Sequelize.BLOB',
        bit: 'Sequelize.BLOB',

        char: 'Sequelize.STRING',
        varchar: 'Sequelize.STRING',
        tinytext: 'Sequelize.STRING',
        mediumtext: 'Sequelize.STRING',
        longtext: 'Sequelize.STRING',
        text: 'Sequelize.STRING',
        'enum': 'Sequelize.STRING',
        set: 'Sequelize.STRING',
        time: 'Sequelize.STRING',
        geometry: 'Sequelize.STRING'
    };

    public uniqueReferences():Reference[] {
        const u:Reference[] = [];

        const foundIds: any = {};

        this.references.forEach(addReferenceIfUnique);

        this.tables.forEach(addTablePrimaryKeys);

        return u;

        function addReferenceIfUnique(reference:Reference, index:number, array:Reference[]):void {
            if (reference.isView || foundIds[reference.foreignKey]) {
                return;
            }

            u.push(reference);

            foundIds[reference.foreignKey] = true;
        }

        function addTablePrimaryKeys(table:Table, index:number, array:Table[]):void {
            if (table.isView || table.tableName.substr(0,4) === 'Xref') {
                return;
            }
            const pk:Field = table.fields[0];

            if (foundIds[pk.fieldName]) {
                return;
            }
            foundIds[pk.fieldName] = true;

            const r:Reference = new Reference(
                table.tableName,
                table.tableName,
                undefined,
                pk.originalFieldName,
                pk.originalFieldName,
                false,
                this);
            u.push(r);
        }
    }
}

export class Table
{
    fields:Array<Field> = [];
    isView:boolean = false;

    constructor(public schema:Schema, public tableName:string)
    {

    }

    public tableNameSingular():string
    {
        return toProperSingularizeCase(this.tableName);
    }

    public tableNameSingularNormal():string
    {
        return Sequelize.Utils.singularize(this.tableName);
    }

    public tableNameCamel():string
    {
        return camelTitleCase(this.tableName);
    }

    public tableNameModel():string
    {
        return this.schema.useModelFactory ? this.tableNameCamel() : this.tableName;
    }

    public realDbFields():Field[] {
        return this.fields.filter(f => !f.referencedCol && !f.isCalculated);
    }
    idField():Field {
        return _.find(this.fields, f => f.isIdField());
    }

    idFieldName():string {
        const idField:Field = this.idField();
        if (idField === undefined) {
            console.log('Unable to find ID field for type: ' + this.tableName);
            return '!!cannotFindIdFieldOn' + this.tableName + '!!';
        }
        return idField.fieldName;
    }

    idFieldNameTitleCase():string {
        const idField:Field = this.idField();
        if (idField === undefined) {
            console.log('Unable to find ID field for type: ' + this.tableName);
            return '!!cannotFindIdFieldOn' + this.tableName + '!!';
        }
        return idField.fieldNameProperCase();
    }
}

export class Field
{
    public targetIdFieldType:string; // if this is a prefixed foreign key, then the name of the non-prefixed key is here

    constructor(public originalFieldName:string, public fieldName:string, public fieldType:string, public table:Table, public referencedCol:string | Boolean = false, public isCalculated:boolean = false)
    {

    }

    fieldNameProperCase():string
    {
        return toTitleCase(this.fieldName);
    }

    translatedFieldType():string
    {
        const fieldType:string = this.fieldType;
        let translated:string = Schema.fieldTypeTranslations[fieldType];
        if (translated == undefined) {
            const fieldTypeLength:number = fieldType.length;
            if (fieldTypeLength < 6 ||
                (   fieldType.substr(fieldTypeLength - 4, 4) !== 'Pojo' &&
                fieldType.substr(fieldTypeLength - 6, 6) !== 'Pojo[]')
            )
            {
                console.log('Unable to translate field type:' + fieldType);
            }

            if (fieldType.substr(0, 6) === 'types.') {
                console.log('Removing types prefix from ' + fieldType);
                translated = fieldType.substr(6);
            } else {
                translated = fieldType;
            }
        }
        return translated;
    }

    sequelizeFieldType(): string
    {
        let translated: string =
            `{type: ${Schema.fieldTypeSequelize[this.fieldType]}, field: '${this.originalFieldName}'}`;

        if (translated == undefined) {
            console.log('Unable to sequelize field type:' + this.fieldType);
            translated =
                `{type: ${this.fieldType}, field: '${this.originalFieldName}'}`;
        }
        return translated;
    }

    isIdField():boolean {
        return this.targetIdFieldType != undefined || Boolean(this.table.schema.idFieldLookup[this.fieldName]);
    }

    customFieldType():string
    {
        return this.referencedCol
                ? this.fieldType
                : this.translatedFieldType();
    }

    defineFieldType():string {
        if ( this == this.table.fields[0]) {
            const originalFieldName = this.table.fields[0].originalFieldName;
            return `{type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: '${originalFieldName}'}`;
        } else if (this.table.tableName.substr(0,4) == 'Xref' && this == this.table.fields[1]) {
            const originalFieldName = this.table.fields[1].originalFieldName;
            return `{type: 'number', primaryKey: true, field: '${originalFieldName}'}`;
        }
        return this.sequelizeFieldType();
    }

    public tableNameSingular():string
    {
        return this.table.tableNameSingular();
    }

    public tableNameSingularNormal():string
    {
        return this.table.tableNameSingularNormal();
    }
}

export class Reference {

    constructor(public primaryTableName:string,
                public foreignTableName:string,
                public associationName:string,
                public primaryKey:string,
                public foreignKey:string,
                public isView:boolean,
                private schema:Schema) {
    }

    public primaryTableNameCamel():string
    {
        return camelTitleCase(this.primaryTableName);
    }

    public primaryTableNameModel():string {
        return this.schema.useModelFactory ? this.primaryTableNameCamel() : this.primaryTableName;
    }
    public foreignTableNameCamel():string
    {
        return camelTitleCase(this.foreignTableName);
    }

    public foreignTableNameRealCamel():string
    {
      return Sequelize.Utils.pluralize(toCamelCase(this.foreignTableName));
    }

    associationNameQuoted():string {
        return this.associationName
            ? '\'' + this.associationName + '\''
            : undefined;
    }
}

export class Xref {

    constructor(public firstTableName:string,
                public firstFieldName:string,
                public secondTableName:string,
                public secondFieldName:string,
                public xrefTableName:string) {

    }

    public firstTableNameCamel():string
    {
        return camelTitleCase(this.firstTableName);
    }

    public secondTableNameCamel():string
    {
        return camelTitleCase(this.secondTableName);
    }

}

// Associations are named foreign keys, like OwnerUserID
export class Association {
    constructor(public associationName:string) {
        this.associationName = toCamelCase(associationName);
    }
}

interface ColumnDefinitionRow
{
    table_name:string;
    column_name:string;
    data_type:string;
    ordinal_position:number;
}

interface ReferenceDefinitionRow
{
    table_name:string;
    column_name:string;
    referenced_table_name:string;
    referenced_column_name:string;
}

interface CustomFieldDefinitionRow extends ColumnDefinitionRow, ReferenceDefinitionRow
{

}

export function read(database:string, username:string, password:string, options:sequelize.Options, callback:(err:Error, schema:Schema) => void):void
{
    let schema:Schema;
    const sequelize:sequelize.Sequelize = new Sequelize(database, username, password, options);
    const tableLookup:util.Dictionary<Table> = {};
    const xrefs:util.Dictionary<Xref> = {};
    const associationsFound:util.Dictionary<boolean> = {};
    let customReferenceRows:ReferenceDefinitionRow[] = [];
    const idFieldLookup:util.Dictionary<boolean> = {};

    const sql:string =
        "select table_name, column_name, data_type, ordinal_position " +
        "from information_schema.columns " +
        "where table_schema = '" + database + "' " +
        "order by table_name, ordinal_position";

    sequelize
        .query(sql, {type: Sequelize.QueryTypes.SELECT})
        .then(processTablesAndColumns)
        .catch(function(err: Error) {
            callback(err, null);
            return;
        });
    function processTablesAndColumns(rows:Array<ColumnDefinitionRow>):void
    {
        if (rows == null)
        {
            const err:Error = new Error("No schema info returned for database.");
            callback(err, null);
            return;
        }

        if (rows.length == 0)
        {
            const err:Error = new Error("Empty schema info returned for database.");
            callback(err, null);
            return;
        }

        readCustomFields(rows);
    }

    function readCustomFields(originalRows:ColumnDefinitionRow[]):void {

        if (!_.some(originalRows, r => r.table_name == 'SequelizeCustomFieldDefinitions')) {
            processTablesAndColumnsWithCustom(originalRows, {});
            return;
        }

        const sql:string =
            "select table_name, column_name, data_type, referenced_table_name, referenced_column_name, ordinal_position " +
            "from SequelizeCustomFieldDefinitions " +
            "order by table_name, ordinal_position";

        sequelize
            .query(sql, {type: Sequelize.QueryTypes.SELECT})
            .then(processCustomFields)
            .catch(function(err: Error) {
                callback(err, null);
                return;
            });
        function processCustomFields(customFields:CustomFieldDefinitionRow[]):void {
            const customFieldLookup:util.Dictionary<ColumnDefinitionRow> =
                util.arrayToDictionary(customFields,'column_name');

            const combined:ColumnDefinitionRow[] = originalRows.concat(customFields);
            combined.sort(sortByTableNameThenOrdinalPosition);

            customReferenceRows = _.filter(customFields, cf => cf.referenced_table_name != null && cf.referenced_column_name != null);

            processTablesAndColumnsWithCustom(combined, customFieldLookup);
        }

    }

    function sortByTableNameThenOrdinalPosition(row1:ColumnDefinitionRow, row2:ColumnDefinitionRow):number {
        return row1.table_name < row2.table_name
            ? -1
            : (row1.table_name > row2.table_name
                ? 1
                : ( row1.ordinal_position < row2.ordinal_position
                    ? -1
                    : ( row1.ordinal_position > row2.ordinal_position
                        ? 1
                        : 0)));
    }

    function processTablesAndColumnsWithCustom(rows:ColumnDefinitionRow[], customFieldLookup:util.Dictionary<ColumnDefinitionRow>):void {

        const tables:Array<Table> = [];
        schema = new Schema(tables);

        let table:Table = new Table(schema, "");

        const calculatedFieldsFound: any = {};

        for(let index:number = 0; index<rows.length; index++)
        {
            const row:ColumnDefinitionRow = rows[index];

            if (row.table_name === 'SequelizeCustomFieldDefinitions') {
                continue;
            }

            if (row.table_name != table.tableName)
            {
                table = new Table(schema, row.table_name);
                tables.push(table);
            }

            const isCalculated:boolean = customFieldLookup[row.column_name] !== undefined;

            const field:Field = new Field(
                row.column_name,
                toCamelCase(row.column_name),
                row.data_type,
                table,
                false,
                isCalculated);
            table.fields.push(field);

            if (isCalculated && !calculatedFieldsFound[field.fieldName]) {
                schema.calculatedFields.push(field);
                calculatedFieldsFound[field.fieldName] = true;
            }
        }

        processIdFields();

        readReferences();
    }

    function readReferences():void {

        const sql:string =
            "SELECT	table_name, column_name, referenced_table_name, referenced_column_name " +
            "FROM 	information_schema.key_column_usage " +
            "WHERE	constraint_schema = '" + database + "' " +
            "AND	referenced_table_name IS NOT NULL;";

        sequelize
            .query(sql, {type: Sequelize.QueryTypes.SELECT})
            .then(processReferences)
            .catch(function(err: Error) {
                callback(err, null);
                return;
            });
    }

    function processReferences(rows:Array<ReferenceDefinitionRow>):void
    {
        if (rows == null || rows.length == 0)
        {
            console.log("Warning: No references defined in database.");
            callback(null, schema);
            return;
        }
        schema.tables.forEach(table => tableLookup[table.tableName] = table);

        rows.forEach(processReferenceRow);
        customReferenceRows.forEach(processReferenceRow);

        processReferenceXrefs();

        fixViewNames();

        function processReferenceRow(row:ReferenceDefinitionRow):void {
            if (row.table_name.length > 4 && row.table_name.substr(0, 4) == 'Xref')
            {
                processReferenceXrefRow(row);
                return;
            }

            // Example rows for
            //
            // CREATE TABLE Leads (
            //    leadId integer PRIMARY KEY AUTO_INCREMENT,
            //    accountId integer NOT NULL,
            //
            //    FOREIGN KEY (accountId) REFERENCES Accounts (accountId),
            //  );
            //
            // table_name               =   Leads
            // column_name              =   accountId
            // referenced_table_name    =   Accounts
            // referenced_column_name   =   accountId
            //
            const parentTable = tableLookup[row.referenced_table_name];
            const childTable = tableLookup[row.table_name];

            let associationName:string;
            if (row.column_name !== row.referenced_column_name) {

                // example, row.column_name is ownerUserID
                // we want association to be called OwnerUsers
                // so we take first character and make it uppercase,
                // then take rest of prefix from foreign key
                // then append the referenced table name
                // associationName = row.column_name.charAt(0).toUpperCase() +
                //     row.column_name.substr(1, row.column_name.length - row.referenced_column_name.length - 1) +
                //     row.referenced_table_name;
                associationName = row.column_name;

                // snake or camel case?
                associationName += Schema.dbNameCase === 'snake' ?
                    '_' + row.referenced_table_name : toTitleCase(row.referenced_table_name);

                if (!associationsFound[associationName]) {
                    schema.associations.push(new Association(associationName));
                    associationsFound[associationName] = true;
                }
            }

            // create array of children in parent, i.e., AccountPojo.leads:LeadPojo[]
            // but not for custom fields
            if (!row.hasOwnProperty('ordinal_position')) {

                // if a one table has two foreign keys to same parent table, we end up
                // with two arrays but Sequelize actually only supports one, so we need
                // to make sure we only create one field in the parent table
                var fieldName = util.camelCase(row.table_name);

                // To support `user.createdByIssues`, `user.assignedToIssues`,... instead of being
                // user.issues for all cases.
                const fieldNameAlias = associationName ? row.column_name + '_' + row.table_name :
                  row.table_name;

                if (!parentTable.fields.some(f => f.fieldName === fieldName)) {
                    parentTable.fields.push(new Field(
                        fieldName,
                        Sequelize.Utils.pluralize(toCamelCase(fieldNameAlias)),// Leads
                        toProperSingularizeCase(row.table_name) + 'Pojo[]',    // Leads -> LeadPojo[]
                        parentTable,                                           // Accounts table reference
                        fieldName));
                }
            }

            // create singular parent reference from child
            childTable.fields.push(new Field(
                row.column_name,
                toCamelCase(singularize(
                    associationName === undefined
                        ? row.referenced_table_name                             // Accounts -> account
                        : associationName)),                                    // ownerUserId -> OwnerUsers -> ownerUser
                toProperSingularizeCase(row.referenced_table_name) + 'Pojo',    // Accounts -> AccountPojo
                childTable,
                true));

            // tell Sequelize about the reference
            schema.references.push(new Reference(
                row.referenced_table_name,
                row.table_name,
                toCamelCase(singularize(associationName === undefined
                    ? row.referenced_table_name                             // Accounts -> account
                    : associationName)),
                row.referenced_table_name + '_' + Schema.idSuffix,
                row.column_name,
                false,
                schema));
        }

        function processReferenceXrefRow(row:ReferenceDefinitionRow):void {
            const xref:Xref = xrefs[row.table_name];

            if (xref == null) {
                xrefs[row.table_name] = new Xref(
                    row.referenced_table_name,
                    row.referenced_column_name,
                    null,
                    null,
                    row.table_name);
            } else {
                xref.secondTableName = row.referenced_table_name;
                xref.secondFieldName = row.referenced_column_name;
            }
        }

        function processReferenceXrefs():void {
            for (const xrefName in xrefs) {

                if (!xrefs.hasOwnProperty(xrefName)) {
                    continue;
                }

                const xref:Xref = xrefs[xrefName];

                schema.xrefs.push(xref);

                const firstTable:Table = tableLookup[xref.firstTableName];
                const secondTable:Table = tableLookup[xref.secondTableName];

                firstTable.fields.push(new Field(
                    xref.secondTableName,
                    toCamelCase(xref.secondTableName),
                    toProperSingularizeCase(xref.secondTableName) + 'Pojo[]',
                    firstTable,
                    true));

                secondTable.fields.push(new Field(
                    xref.firstTableName,
                    toCamelCase(xref.firstTableName),
                    toProperSingularizeCase(xref.firstTableName) + 'Pojo[]',
                    secondTable,
                    true));

            }
        }
    }

    function fixViewNames():void {

        const tableNamesManyForms:string[] = [];

        _.each(schema.tables, extrapolateTableNameForms);

        _.each(schema.tables, fixViewName);

        if (schema.views.length) {
            addViewReferences();
        }

        callback(null, schema);

        function extrapolateTableNameForms(table:Table, index:number, array:Table[]):void {

            if (table.tableName === table.tableName.toLowerCase()) {
                return;
            }

            tableNamesManyForms.push(table.tableName);
            tableNamesManyForms.push(toProperSingularizeCase(table.tableName));
        }

        function fixViewName(table:Table, index:number, array:Table[]):void {

            if (table.tableName !== table.tableName.toLowerCase()) {
                return;
            }
            table.isView = true;
            schema.views.push(table);

            _.each(tableNamesManyForms, fixViewNamePart);

            function fixViewNamePart(otherTableNameForm:string, index:number, array:string[]):void {
                const i:number = table.tableName.indexOf(otherTableNameForm.toLowerCase());
                if (i < 0) {
                    return;
                }

                let newTableName:string = '';

                if (i !== 0) {
                    newTableName = table.tableName.substr(0, i);
                }

                newTableName += otherTableNameForm;

                if (table.tableName.length > i + otherTableNameForm.length + 1) {
                    newTableName += table.tableName.charAt(i + otherTableNameForm.length).toUpperCase() +
                        table.tableName.substr(i + otherTableNameForm.length + 1);
                }

                table.tableName = newTableName;
            }
        }
    }

    function addViewReferences():void {
        schema.views.forEach(addViewReference);
    }

    function addViewReference(view:Table, index:number, array:Table[]):void {
        view.fields.forEach(addViewFieldReference);

        function addViewFieldReference(field:Field, index:number, array:Field[]):void {
            if (!field.isIdField()) {
                return;
            }

            // const otherTableName:string = Sequelize.Utils.pluralize(field.fieldNameProperCase().substr(0, field.fieldName.length - Schema.idSuffix.length));
            const otherTableName:string = view.tableName;

            const otherTable:Table = tableLookup[otherTableName];
            if (otherTable === undefined) {
                console.log('Unable to find related table for view ' + view.tableName + '.' + field.fieldName + ', expected ' + otherTableName + '.');
                return;
            }

            // const reference:Reference = new Reference(
            //     otherTableName,
            //     view.tableName,
            //     undefined,
            //     field.originalFieldName,
            //     field.originalFieldName,
            //     true,
            //     schema);

            // schema.references.push(reference);

            // const otherTableSingular:string = toProperSingularizeCase(otherTableName);

            // view.fields.push(new Field(
            //     otherTableSingular,
            //     toCamelCase(otherTableSingular),
            //     otherTableSingular + 'Pojo',
            //     view,
            //     true));

            // otherTable.fields.push(new Field(
            //     view.tableName,
            //     toCamelCase(view.tableName),
            //     toProperSingularizeCase(view.tableName) + 'Pojo[]',
            //     otherTable,
            //     true));

        }
    }

    function processIdFields():void
    {
        const idSuffix = Schema.idSuffix;

        if (idSuffix == null || !idSuffix.length)
        {
            return;
        }

        const idFields:Array<Field> = [];

        const idSuffixLen:number = idSuffix.length;

        for(let tableIndex:number = 0; tableIndex < schema.tables.length; tableIndex++)
        {
            const table:Table = schema.tables[tableIndex];

            if (table == null || table.fields == null || table.fields.length === 0)
            {
                continue;
            }

            const field:Field = table.fields[0];
            const fieldName:string = field.fieldName;

            if (!idFieldLookup[fieldName] &&
                fieldName.length > idSuffixLen &&
                fieldName.substr(fieldName.length - idSuffixLen, idSuffixLen).toLocaleLowerCase() == idSuffix)
            {
                idFields.push(field);
                idFieldLookup[fieldName] = true;
            }
        }

        schema.idFields = idFields;
        schema.idFieldLookup = idFieldLookup;

        processPrefixedForeignKeyTypes();
    }

    function processPrefixedForeignKeyTypes():void {

        const idSuffix = Schema.idSuffix;
        const idSuffixLen:number = idSuffix.length;

        for(let tableIndex:number = 0; tableIndex < schema.tables.length; tableIndex++)
        {
            const table:Table = schema.tables[tableIndex];

            if (table == null || table.fields == null || table.fields.length < 2)
            {
                continue;
            }

            // first field is never a prefixed foreign key
            for(let fieldIndex:number = 1; fieldIndex < table.fields.length; fieldIndex++)
            {
                const field:Field = table.fields[fieldIndex];
                const fieldName:string = field.fieldName;

                if (!idFieldLookup[fieldName] &&
                    fieldName.length > idSuffixLen &&
                    fieldName.substr(fieldName.length - idSuffixLen, idSuffixLen).toLocaleLowerCase() == idSuffix)
                {
                    // not in lookup but is id field, so must be prefixed id field
                    // ex. ownerUserId
                    //
                    // need to find the actual id field
                    // ex. userId

                    for(let c:number = 1; c<fieldName.length - 2; c++) {
                        const rest:string = fieldName.charAt(c).toLowerCase() + fieldName.substr(c + 1);
                        if (idFieldLookup[rest]) {
                            // found it
                            field.targetIdFieldType = rest.charAt(0).toUpperCase() + rest.substr(1);
                        }
                    }
                }
            }
        }
    }
}

function toTitleCase(text:string):string {
    return text.charAt(0).toUpperCase() + text.substr(1);
}

function toCamelCase(text:string):string {
    const lowerCaseStr = text.charAt(0).toLowerCase() + text.substr(1);
    return lowerCaseStr.replace(/(\_\w)/g, m => m[1].toUpperCase());
}

function singularize(text:string):string {
    return Sequelize.Utils.singularize(text);
}

function toProperSingularizeCase(text:string):string {
    return toTitleCase(toCamelCase(singularize(text)));
}

function camelTitleCase(text:string):string {
    return toTitleCase(toCamelCase(text));
}
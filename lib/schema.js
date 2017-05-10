/****************************
 *
 * Loads and exposes schema from database
 * @TODO Remove this redundancy: keep only camelCase attrs
 * {"issues": [{"createdBy": 1,"assignedTo": 1, "created_by": 1,"assigned_to": 1}]}
*/
"use strict";
const sequelize_1 = require('sequelize');
const _ = require('lodash');
const util = require('./util');
const Sequelize = sequelize_1.default;
class Schema {
    constructor(tables) {
        this.tables = tables;
        // For template
        this.momentJsImport = Schema.useMomentJs ? [{ name: 'moment' }] : [];
        this.references = [];
        this.xrefs = [];
        this.associations = [];
        this.calculatedFields = [];
        this.views = [];
        this.idFields = [];
        this.idFieldLookup = {};
        this.useModelFactory = false;
    }
    uniqueReferences() {
        const u = [];
        const foundIds = {};
        this.references.forEach(addReferenceIfUnique);
        this.tables.forEach(addTablePrimaryKeys);
        return u;
        function addReferenceIfUnique(reference, index, array) {
            if (reference.isView || foundIds[reference.foreignKey]) {
                return;
            }
            u.push(reference);
            foundIds[reference.foreignKey] = true;
        }
        function addTablePrimaryKeys(table, index, array) {
            if (table.isView || table.tableName.substr(0, 4) === 'Xref') {
                return;
            }
            const pk = table.fields[0];
            if (foundIds[pk.fieldName]) {
                return;
            }
            foundIds[pk.fieldName] = true;
            const r = new Reference(table.tableName, table.tableName, undefined, pk.originalFieldName, pk.originalFieldName, false, this);
            u.push(r);
        }
    }
}
Schema.idSuffix = "id"; // NOTE: Must be LOWER case
Schema.dbNameCase = "snake";
Schema.useMomentJs = true;
Schema.fieldTypeTranslations = {
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
Schema.fieldTypeSequelize = {
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
exports.Schema = Schema;
class Table {
    constructor(schema, tableName) {
        this.schema = schema;
        this.tableName = tableName;
        this.fields = [];
        this.isView = false;
    }
    tableNameSingular() {
        return toProperSingularizeCase(this.tableName);
    }
    tableNameSingularNormal() {
        return Sequelize.Utils.singularize(this.tableName);
    }
    tableNameCamel() {
        return camelTitleCase(this.tableName);
    }
    tableNameModel() {
        return this.schema.useModelFactory ? this.tableNameCamel() : this.tableName;
    }
    realDbFields() {
        return this.fields.filter(f => !f.referencedCol && !f.isCalculated);
    }
    idField() {
        return _.find(this.fields, f => f.isIdField());
    }
    idFieldName() {
        const idField = this.idField();
        if (idField === undefined) {
            console.log('Unable to find ID field for type: ' + this.tableName);
            return '!!cannotFindIdFieldOn' + this.tableName + '!!';
        }
        return idField.fieldName;
    }
    idFieldNameTitleCase() {
        const idField = this.idField();
        if (idField === undefined) {
            console.log('Unable to find ID field for type: ' + this.tableName);
            return '!!cannotFindIdFieldOn' + this.tableName + '!!';
        }
        return idField.fieldNameProperCase();
    }
}
exports.Table = Table;
class Field {
    constructor(originalFieldName, fieldName, fieldType, table, referencedCol = false, isCalculated = false) {
        this.originalFieldName = originalFieldName;
        this.fieldName = fieldName;
        this.fieldType = fieldType;
        this.table = table;
        this.referencedCol = referencedCol;
        this.isCalculated = isCalculated;
    }
    fieldNameProperCase() {
        return toTitleCase(this.fieldName);
    }
    translatedFieldType() {
        const fieldType = this.fieldType;
        let translated = Schema.fieldTypeTranslations[fieldType];
        if (translated == undefined) {
            const fieldTypeLength = fieldType.length;
            if (fieldTypeLength < 6 ||
                (fieldType.substr(fieldTypeLength - 4, 4) !== 'Pojo' &&
                    fieldType.substr(fieldTypeLength - 6, 6) !== 'Pojo[]')) {
                console.log('Unable to translate field type:' + fieldType);
            }
            if (fieldType.substr(0, 6) === 'types.') {
                console.log('Removing types prefix from ' + fieldType);
                translated = fieldType.substr(6);
            }
            else {
                translated = fieldType;
            }
        }
        return translated;
    }
    sequelizeFieldType() {
        let translated = '{' +
            `type: ${Schema.fieldTypeSequelize[this.fieldType]},` +
            `field: '${this.originalFieldName}',` +
            (Schema.useMomentJs && this.fieldType === 'datetime' ?
                `get: function()  {
                return moment(this.getDataValue('${this.fieldName}')).format('LLL');
              },` : '') +
            `}`;
        if (translated == undefined) {
            console.log('Unable to sequelize field type:' + this.fieldType);
            translated =
                `{type: ${this.fieldType}, field: '${this.originalFieldName}'}`;
        }
        return translated;
    }
    isIdField() {
        return this.targetIdFieldType != undefined || Boolean(this.table.schema.idFieldLookup[this.fieldName]);
    }
    customFieldType() {
        return this.referencedCol
            ? this.fieldType
            : this.translatedFieldType();
    }
    defineFieldType() {
        if (this == this.table.fields[0]) {
            const originalFieldName = this.table.fields[0].originalFieldName;
            return `{type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: '${originalFieldName}'}`;
        }
        else if (this.table.tableName.substr(0, 4) == 'Xref' && this == this.table.fields[1]) {
            const originalFieldName = this.table.fields[1].originalFieldName;
            return `{type: 'number', primaryKey: true, field: '${originalFieldName}'}`;
        }
        return this.sequelizeFieldType();
    }
    tableNameSingular() {
        return this.table.tableNameSingular();
    }
    tableNameSingularNormal() {
        return this.table.tableNameSingularNormal();
    }
}
exports.Field = Field;
class Reference {
    constructor(primaryTableName, foreignTableName, associationName, primaryKey, foreignKey, isView, schema) {
        this.primaryTableName = primaryTableName;
        this.foreignTableName = foreignTableName;
        this.associationName = associationName;
        this.primaryKey = primaryKey;
        this.foreignKey = foreignKey;
        this.isView = isView;
        this.schema = schema;
    }
    primaryTableNameCamel() {
        return camelTitleCase(this.primaryTableName);
    }
    primaryTableNameModel() {
        return this.schema.useModelFactory ? this.primaryTableNameCamel() : this.primaryTableName;
    }
    foreignTableNameCamel() {
        return camelTitleCase(this.foreignTableName);
    }
    foreignTableNameRealCamel() {
        return Sequelize.Utils.pluralize(toCamelCase(this.foreignTableName));
    }
    associationNameQuoted() {
        return this.associationName
            ? '\'' + this.associationName + '\''
            : undefined;
    }
}
exports.Reference = Reference;
class Xref {
    constructor(firstTableName, firstFieldName, secondTableName, secondFieldName, xrefTableName) {
        this.firstTableName = firstTableName;
        this.firstFieldName = firstFieldName;
        this.secondTableName = secondTableName;
        this.secondFieldName = secondFieldName;
        this.xrefTableName = xrefTableName;
    }
    firstTableNameCamel() {
        return camelTitleCase(this.firstTableName);
    }
    secondTableNameCamel() {
        return camelTitleCase(this.secondTableName);
    }
}
exports.Xref = Xref;
// Associations are named foreign keys, like OwnerUserID
class Association {
    constructor(associationName) {
        this.associationName = associationName;
        this.associationName = toCamelCase(associationName);
    }
}
exports.Association = Association;
function read(database, username, password, options, callback) {
    let schema;
    const sequelize = new Sequelize(database, username, password, options);
    const tableLookup = {};
    const xrefs = {};
    const associationsFound = {};
    let customReferenceRows = [];
    const idFieldLookup = {};
    const sql = "select table_name, column_name, data_type, ordinal_position " +
        "from information_schema.columns " +
        "where table_schema = '" + database + "' " +
        "order by table_name, ordinal_position";
    sequelize
        .query(sql, { type: Sequelize.QueryTypes.SELECT })
        .then(processTablesAndColumns)
        .catch(function (err) {
        callback(err, null);
        return;
    });
    function processTablesAndColumns(rows) {
        if (rows == null) {
            const err = new Error("No schema info returned for database.");
            callback(err, null);
            return;
        }
        if (rows.length == 0) {
            const err = new Error("Empty schema info returned for database.");
            callback(err, null);
            return;
        }
        readCustomFields(rows);
    }
    function readCustomFields(originalRows) {
        if (!_.some(originalRows, r => r.table_name == 'SequelizeCustomFieldDefinitions')) {
            processTablesAndColumnsWithCustom(originalRows, {});
            return;
        }
        const sql = "select table_name, column_name, data_type, referenced_table_name, referenced_column_name, ordinal_position " +
            "from SequelizeCustomFieldDefinitions " +
            "order by table_name, ordinal_position";
        sequelize
            .query(sql, { type: Sequelize.QueryTypes.SELECT })
            .then(processCustomFields)
            .catch(function (err) {
            callback(err, null);
            return;
        });
        function processCustomFields(customFields) {
            const customFieldLookup = util.arrayToDictionary(customFields, 'column_name');
            const combined = originalRows.concat(customFields);
            combined.sort(sortByTableNameThenOrdinalPosition);
            customReferenceRows = _.filter(customFields, cf => cf.referenced_table_name != null && cf.referenced_column_name != null);
            processTablesAndColumnsWithCustom(combined, customFieldLookup);
        }
    }
    function sortByTableNameThenOrdinalPosition(row1, row2) {
        return row1.table_name < row2.table_name
            ? -1
            : (row1.table_name > row2.table_name
                ? 1
                : (row1.ordinal_position < row2.ordinal_position
                    ? -1
                    : (row1.ordinal_position > row2.ordinal_position
                        ? 1
                        : 0)));
    }
    function processTablesAndColumnsWithCustom(rows, customFieldLookup) {
        const tables = [];
        schema = new Schema(tables);
        let table = new Table(schema, "");
        const calculatedFieldsFound = {};
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            if (row.table_name === 'SequelizeCustomFieldDefinitions') {
                continue;
            }
            if (row.table_name != table.tableName) {
                table = new Table(schema, row.table_name);
                tables.push(table);
            }
            const isCalculated = customFieldLookup[row.column_name] !== undefined;
            const field = new Field(row.column_name, toCamelCase(row.column_name), row.data_type, table, false, isCalculated);
            table.fields.push(field);
            if (isCalculated && !calculatedFieldsFound[field.fieldName]) {
                schema.calculatedFields.push(field);
                calculatedFieldsFound[field.fieldName] = true;
            }
        }
        processIdFields();
        readReferences();
    }
    function readReferences() {
        const sql = "SELECT	table_name, column_name, referenced_table_name, referenced_column_name " +
            "FROM 	information_schema.key_column_usage " +
            "WHERE	constraint_schema = '" + database + "' " +
            "AND	referenced_table_name IS NOT NULL;";
        sequelize
            .query(sql, { type: Sequelize.QueryTypes.SELECT })
            .then(processReferences)
            .catch(function (err) {
            callback(err, null);
            return;
        });
    }
    function processReferences(rows) {
        if (rows == null || rows.length == 0) {
            console.log("Warning: No references defined in database.");
            callback(null, schema);
            return;
        }
        schema.tables.forEach(table => tableLookup[table.tableName] = table);
        rows.forEach(processReferenceRow);
        customReferenceRows.forEach(processReferenceRow);
        processReferenceXrefs();
        fixViewNames();
        function processReferenceRow(row) {
            if (row.table_name.length > 4 && row.table_name.substr(0, 4) == 'Xref') {
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
            let associationName;
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
                    parentTable.fields.push(new Field(fieldName, Sequelize.Utils.pluralize(toCamelCase(fieldNameAlias)), // Leads
                    toProperSingularizeCase(row.table_name) + 'Pojo[]', // Leads -> LeadPojo[]
                    parentTable, // Accounts table reference
                    fieldName));
                }
            }
            // create singular parent reference from child
            childTable.fields.push(new Field(row.column_name, toCamelCase(singularize(associationName === undefined
                ? row.referenced_table_name // Accounts -> account
                : associationName)), // ownerUserId -> OwnerUsers -> ownerUser
            toProperSingularizeCase(row.referenced_table_name) + 'Pojo', // Accounts -> AccountPojo
            childTable, true));
            // tell Sequelize about the reference
            schema.references.push(new Reference(row.referenced_table_name, row.table_name, toCamelCase(singularize(associationName === undefined
                ? row.referenced_table_name // Accounts -> account
                : associationName)), row.referenced_table_name + '_' + Schema.idSuffix, row.column_name, false, schema));
        }
        function processReferenceXrefRow(row) {
            const xref = xrefs[row.table_name];
            if (xref == null) {
                xrefs[row.table_name] = new Xref(row.referenced_table_name, row.referenced_column_name, null, null, row.table_name);
            }
            else {
                xref.secondTableName = row.referenced_table_name;
                xref.secondFieldName = row.referenced_column_name;
            }
        }
        function processReferenceXrefs() {
            for (const xrefName in xrefs) {
                if (!xrefs.hasOwnProperty(xrefName)) {
                    continue;
                }
                const xref = xrefs[xrefName];
                schema.xrefs.push(xref);
                const firstTable = tableLookup[xref.firstTableName];
                const secondTable = tableLookup[xref.secondTableName];
                firstTable.fields.push(new Field(xref.secondTableName, toCamelCase(xref.secondTableName), toProperSingularizeCase(xref.secondTableName) + 'Pojo[]', firstTable, true));
                secondTable.fields.push(new Field(xref.firstTableName, toCamelCase(xref.firstTableName), toProperSingularizeCase(xref.firstTableName) + 'Pojo[]', secondTable, true));
            }
        }
    }
    function fixViewNames() {
        const tableNamesManyForms = [];
        _.each(schema.tables, extrapolateTableNameForms);
        _.each(schema.tables, fixViewName);
        if (schema.views.length) {
            addViewReferences();
        }
        callback(null, schema);
        function extrapolateTableNameForms(table, index, array) {
            if (table.tableName === table.tableName.toLowerCase()) {
                return;
            }
            tableNamesManyForms.push(table.tableName);
            tableNamesManyForms.push(toProperSingularizeCase(table.tableName));
        }
        function fixViewName(table, index, array) {
            if (table.tableName !== table.tableName.toLowerCase()) {
                return;
            }
            table.isView = true;
            schema.views.push(table);
            _.each(tableNamesManyForms, fixViewNamePart);
            function fixViewNamePart(otherTableNameForm, index, array) {
                const i = table.tableName.indexOf(otherTableNameForm.toLowerCase());
                if (i < 0) {
                    return;
                }
                let newTableName = '';
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
    function addViewReferences() {
        schema.views.forEach(addViewReference);
    }
    function addViewReference(view, index, array) {
        view.fields.forEach(addViewFieldReference);
        function addViewFieldReference(field, index, array) {
            if (!field.isIdField()) {
                return;
            }
            // const otherTableName:string = Sequelize.Utils.pluralize(field.fieldNameProperCase().substr(0, field.fieldName.length - Schema.idSuffix.length));
            const otherTableName = view.tableName;
            const otherTable = tableLookup[otherTableName];
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
    function processIdFields() {
        const idSuffix = Schema.idSuffix;
        if (idSuffix == null || !idSuffix.length) {
            return;
        }
        const idFields = [];
        const idSuffixLen = idSuffix.length;
        for (let tableIndex = 0; tableIndex < schema.tables.length; tableIndex++) {
            const table = schema.tables[tableIndex];
            if (table == null || table.fields == null || table.fields.length === 0) {
                continue;
            }
            const field = table.fields[0];
            const fieldName = field.fieldName;
            if (!idFieldLookup[fieldName] &&
                fieldName.length > idSuffixLen &&
                fieldName.substr(fieldName.length - idSuffixLen, idSuffixLen).toLocaleLowerCase() == idSuffix) {
                idFields.push(field);
                idFieldLookup[fieldName] = true;
            }
        }
        schema.idFields = idFields;
        schema.idFieldLookup = idFieldLookup;
        processPrefixedForeignKeyTypes();
    }
    function processPrefixedForeignKeyTypes() {
        const idSuffix = Schema.idSuffix;
        const idSuffixLen = idSuffix.length;
        for (let tableIndex = 0; tableIndex < schema.tables.length; tableIndex++) {
            const table = schema.tables[tableIndex];
            if (table == null || table.fields == null || table.fields.length < 2) {
                continue;
            }
            // first field is never a prefixed foreign key
            for (let fieldIndex = 1; fieldIndex < table.fields.length; fieldIndex++) {
                const field = table.fields[fieldIndex];
                const fieldName = field.fieldName;
                if (!idFieldLookup[fieldName] &&
                    fieldName.length > idSuffixLen &&
                    fieldName.substr(fieldName.length - idSuffixLen, idSuffixLen).toLocaleLowerCase() == idSuffix) {
                    // not in lookup but is id field, so must be prefixed id field
                    // ex. ownerUserId
                    //
                    // need to find the actual id field
                    // ex. userId
                    for (let c = 1; c < fieldName.length - 2; c++) {
                        const rest = fieldName.charAt(c).toLowerCase() + fieldName.substr(c + 1);
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
exports.read = read;
function toTitleCase(text) {
    return text.charAt(0).toUpperCase() + text.substr(1);
}
function toCamelCase(text) {
    const lowerCaseStr = text.charAt(0).toLowerCase() + text.substr(1);
    return lowerCaseStr.replace(/(\_\w)/g, m => m[1].toUpperCase());
}
function singularize(text) {
    return Sequelize.Utils.singularize(text);
}
function toProperSingularizeCase(text) {
    return toTitleCase(toCamelCase(singularize(text)));
}
function camelTitleCase(text) {
    return toTitleCase(toCamelCase(text));
}
//# sourceMappingURL=schema.js.map
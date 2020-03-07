const readXlsxFile = require('read-excel-file/node')
const gettextParser = require('gettext-parser')
const fs = require('fs')
const path = require('path')
const YAML = require('yaml')
const os = require('os')

const args = process.argv.slice(2)
if (args.length < 1) {
    console.log('Please indicate an Excel file.')
    console.log('Example: node excel-to-gettext.js my-excel-file.xlsx')
    return
}

const excelFile = args[0]

// Goals:
/*
Parses one file at a time.
Parses all sheets in the file, assuming that the name of the sheet is the indicator id.
Alternatively, looks for the indicator id in the actual metadata.

*/

// Get a header for a PO file.
function getHeaders() {
    const headers = {
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding': '8bit'
    }
    return headers
}

// Generate translatable units.
function getUnit(source, context) {
    if (typeof string !== 'string') {
        source = String(source)
    }
    return {
        msgctxt: context,
        msgid: source.replace(/\r\n/g, "\n"),
        msgstr: '',
    }
}

// Helper function to a PO file.
function writePo(indicatorId, units) {
    const data = {
        headers: getHeaders(),
        translations: {
            "": units
        }
    }
    const fileData = gettextParser.po.compile(data)
    const filePath = path.join('translations', 'templates', indicatorId.replace(/\./g, '-') + '.pot')
    fs.writeFileSync(filePath, fileData)
}

// Is this an indicator id?
function isIndicatorId(sheetName) {
    const parts = sheetName.split('.')
    if (parts.length < 3) {
        return false
    }
    return true
}

function cleanIndicatorId(indicatorId) {
    indicatorId = indicatorId.trim()
    const parts = indicatorId.split(' ')
    return parts[0]
}

function updateFieldOrder(indicatorId, fieldNames) {
    const filePath = path.join('scripts', 'field-order.yml')
    const fieldOrder = YAML.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
    fieldOrder[indicatorId] = fieldNames
    const yamlStr = YAML.stringify(fieldOrder)
    fs.writeFileSync(filePath, yamlStr, 'utf8');
}

async function main() {

    const sheets = await readXlsxFile(excelFile, { getSheets: true })
    for (const sheet of sheets) {
        const sheetName = sheet.name
        if (!isIndicatorId(sheetName)) {
            console.log('Warning, skipped sheet "' + sheetName + '" because it is not an indicator id.')
            continue
        }
        const indicatorId = cleanIndicatorId(sheetName)
        const fieldNames = []

        // Loop through the rows of the Excel file to get the fields.
        const rows = await readXlsxFile(excelFile, { sheet: sheetName })
        const headers = rows.shift()
        const units = {}
        for (const row of rows) {
            const field = {}
            for (const [index, header] of headers.entries()) {
                field[header] = row[index]
            }
            let fieldComplete = true
            if (!('ID' in field) || !field['ID']) {
                fieldComplete = false
                console.log('The ID column is missing from the row:')
            }
            if (!('VALUE' in field) || !field['VALUE']) {
                fieldComplete = false
                console.log('The VALUE column is missing from the row:')
            }
            if (!fieldComplete) {
                console.log(field)
                continue
            }
            units[field['ID']] = getUnit(field['VALUE'], field['ID'])
            fieldNames.push(field['ID'])
        }
        writePo(indicatorId, units)
        updateFieldOrder(indicatorId, fieldNames)
    }
}

main()

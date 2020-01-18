const jsToXliff12 = require('xliff/jsToXliff12')
const readXlsxFile = require('read-excel-file/node')
const fs = require('fs')
const path = require('path')
const excelFile = 'source.xlsx'

const sourceLanguage = 'en'
const targetLanguage = 'ru'

// Create the folder
const dir = ['.', 'translations', targetLanguage].join(path.sep);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// These fields should be ignored in the spreadsheet.
const doNotTranslate = [
    'META_PAGE',
    'LANGUAGE',
    'TRANS_SOURCE',
]

// In the course of generating the XLIFF, we'll also be compiling a set of
// translations for goals and targets.
const targets = {}
const goals = {}
// So we need to be able to figure out what target a sheet refers to.
function targetFromSheet(sheetName) {
    // Use dashes instead of dots in these keys.
    return sheetName.split('.').slice(0, 2).join('-')
}
// And we need to be able to figure out what goal a sheet refers to.
function goalFromSheet(sheetName) {
    return sheetName.split('.')[0]
}
// We'll also need to be able to convert sheet names into XLIFF filenames.
function fileFromSheet(sheetName) {
    return sheetName.split(".").slice(0, 3).join("-").split(' ')[0] + '.xliff'
}
// Helper function to generate translatable units.
function getUnit(source, target, note=null) {
    const unit = {
        source: source,
        target: target,
        additionalAttributes: {
          'xml:space': 'preserve',
        },
    }
    if (note) {
        unit.note = note
    }
    return unit
}
// Helper function to an XLIFF file.
function writeXliff(filename, namespace, units) {
    const js = {
        resources: {},
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
    }
    js.resources[namespace] = units
    jsToXliff12(js, (err, res) => {
        fs.writeFile(dir + path.sep + filename, res, function(err) {
            if (err) {
                return console.log(err);
            }
        });
    });
}

async function main() {
    const sheets = await readXlsxFile(excelFile, { getSheets: true })
    for (const sheet of sheets) {
        const sheetName = sheet.name
        const fields = {}
        const rows = await readXlsxFile(excelFile, { sheet: sheetName })

        // Remove the header.
        rows.shift()
        // Loop through the rows.
        for (const row of rows) {
            const [parent, id, value] = row
            // Skip any that are missing a column.
            if (!id || !value || !parent) {
                continue
            }
            // Skip certain rows.
            if (doNotTranslate.includes(id)) {
                continue;
            }
            // Special case, grab the target.
            else if (id === 'SDG_TARGET') {
                targets[targetFromSheet(sheetName)] = getUnit(value, value)
                continue
            }
            // Special case, grab the goal.
            else if (id === 'SDG_GOAL') {
                goals[goalFromSheet(sheetName)] = getUnit(value, value)
                continue
            }
            fields[id] = getUnit(value, '', parent)
        }
        // Write the output for this indicator.
        writeXliff(fileFromSheet(sheetName), sheetName, fields)
    }

    // Write the output for targets and goals.
    writeXliff('targets.xliff', 'targets', targets)
    writeXliff('goals.xliff', 'goals', goals)

}

// Run the asynchronous function.
main();

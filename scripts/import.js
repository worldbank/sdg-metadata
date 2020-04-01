const mammoth = require('mammoth')
const cheerio = require('cheerio')
const gettextParser = require('gettext-parser')
const HTML = require('html')
const fs = require('fs')
const path = require('path')
const schema = require('./import/schema')

const turndown = require('turndown')
const turndownService = new turndown({ headingStyle: 'atx' })
turndownService.keep(['table'])

const args = process.argv.slice(2)
if (args.length < 1) {
    console.log('Please indicate a Word (.docx) file.')
    console.log('Example: npm run import my-word-file.docx')
    process.exit(1)
}
const inputFilePath = path.join(process.env.INIT_CWD, args[0])
mammoth.convertToHtml({path: inputFilePath})
    .then(function(result) {
        const html = result.value
        const units = {}
        const $ = cheerio.load(html)
        $('body > table').each((index, table) => {
            const title = $(table).find('> tbody > tr > td > h1').first().text()
            const section = schema.getSectionByTitle(title)
            const main = getMain(table, $)
            const detailed = getDetailed(table, $)
            const mainId = Object.keys(main)[0]
            const mainValue = Object.values(main)[0]
            const detailedIds = Object.keys(detailed)
            const detailedValues = Object.values(detailed)

            const mainProvided = mainValue
            const detailedProvided = detailedValues.some(val => val)

            let error = ''
            if (mainProvided && detailedProvided) {
                error = 'Please complete the Main Concept OR the Detailed Concepts, but not both.'
            }
            if (!mainProvided && !detailedProvided) {
                error = 'Please complete the Main Concept OR the Detailed Concepts.'
            }
            if (mainProvided && mainId !== section.main) {
                error = `The ID for the main concept (${mainId}) was unexpected.`
            }
            if (detailedProvided && !(detailedIds.every(conceptId => {
                return section.detailed.includes(conceptId)
            }))) {
                error = `One or more IDs for the detailed concepts (${detailedIds.join(', ')}) were unexpected.`
            }

            if (error) {
                printError(title, error)
            }
            else {
                const concepts = mainProvided ? main : detailed
                for (const [conceptId, conceptValue] of Object.entries(concepts)) {
                    units[conceptId] = getUnit(conceptValue, conceptId)
                }
            }
        })

        // For now we assume that the Word file name is the indicator id. This
        // logic will likely be changed as the template is refined.
        const baseName = path.basename(inputFilePath).split('.').slice(0, -1).join('.')
        const indicatorId = dotsToDashes(baseName)
        if (indicatorId.split('-').length < 3) {
            console.log(`ERROR in file "${baseName}"`)
            console.log('Unable to convert filename to indicator ID')
            return
        }

        writePo(indicatorId, units)
    })
    .done()

function getMain(table, $) {
    const main = {}
    $(table).find('> tbody > tr')
        .filter((index, row) => {
            return $(row).find('> td:first-child').text() === 'Main Concept'
        })
        .next().next().each((index, mainRow) => {
            const conceptId = $(mainRow).find('> td:first-child').text().trim()
            const conceptValue = prepareOutput($(mainRow).find('> td:nth-child(4)').html())
            main[conceptId] = conceptValue
        })
    return main
}

function getDetailed(table, $) {
    const detailed = {}
    $(table).find('> tbody > tr')
        .filter((index, row) => {
            return $(row).find('> td:first-child').text() === 'Detailed Concepts'
        })
        .next().nextAll().each((index, detailRow) => {
            const conceptId = $(detailRow).find('> td:first-child').text().trim()
            const conceptValue = prepareOutput($(detailRow).find('> td:nth-child(4)').html())
            detailed[conceptId] = conceptValue
        })
    return detailed
}

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
    indicatorId = dotsToDashes(indicatorId)
    const filePath = path.join('translations', 'templates', indicatorId + '.pot')
    fs.writeFileSync(filePath, fileData)
}

function dotsToDashes(indicatorId) {
    return indicatorId.replace(/\./g, '-')
}

function printError(section, message) {
    console.log(`ERROR in section "${section}"`)
    console.log(message)
    console.log('')
}

function prepareOutput(input) {
    return HTML.prettyPrint(input.trim())
    //return turndownService.turndown(HTML.prettyPrint(input.trim()))
}

const mammoth = require('mammoth')
const cheerio = require('cheerio')
const gettextParser = require('gettext-parser')
const HTML = require('html')
const fs = require('fs')
const path = require('path')
const schema = require('./authoring-tool-schema')

const turndown = require('turndown')
const turndownService = new turndown({ headingStyle: 'atx' })
turndownService.keep(['table'])

const sourceFolder = 'indicators'
const files = fs.readdirSync(sourceFolder).filter(file => {
    return path.extname(file).toLowerCase() === '.docx';
})

for (const file of files) {
    const filePath = path.join(sourceFolder, file)
    mammoth.convertToHtml({path: filePath})
        .then(function(result) {
            const html = result.value
            const units = {}
            const $ = cheerio.load(html)
            $('body > table').each((index, table) => {
                const section = $(table).find('> tbody > tr > td > h1').first().text()
                const concepts = getConcepts(table, $)
                for (const [conceptName, conceptValue] of Object.entries(concepts)) {
                    const conceptId = schema.getConceptIdByName(section, conceptName)
                    units[conceptId] = getUnit(conceptValue, conceptId)
                }
            })

            // For now we assume that the Word file name is the indicator id. This
            // logic will likely be changed as the template is refined.
            const baseName = path.basename(filePath).split('.').slice(0, -1).join('.')
            const indicatorId = dotsToDashes(baseName)
            if (indicatorId.split('-').length < 3) {
                console.log(`ERROR in file "${baseName}"`)
                console.log('Unable to convert filename to indicator ID')
                return
            }

            writePo(indicatorId, units)
        })
        .done()
}

function getConcepts(table, $) {
    const concepts = {}
    $(table).find('> tbody > tr').slice(2).each((index, conceptRow) => {
        const conceptName = $(conceptRow).find('> td:first-child').text().trim()
        const conceptValue = prepareOutput($(conceptRow).find('> td:nth-child(2)').html())
        concepts[conceptName] = conceptValue
    })
    return concepts
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

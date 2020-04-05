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
            $('body > table').each((idx, table) => {
                const section = $(table).find('> tbody > tr > td > h1').first().text()
                if (section) {
                    const concepts = getConcepts(table, $)
                    for (const [conceptName, conceptValue] of Object.entries(concepts)) {
                        const conceptId = schema.getConceptIdByName(section, conceptName)
                        units[conceptId] = getUnit(conceptValue, conceptId)
                    }
                }

                const footnotes = getFootnotes(table, $)
                // TODO: What do we do with them?
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
    $(table).find('> tbody > tr').slice(2).each((idx, conceptRow) => {
        const conceptNameCell = $(conceptRow).find('> td:first-child')
        const conceptName = $(conceptNameCell)
            // Remove the footnotes that the names have.
            .clone().find('sup').remove().end()
            // And get the plain text that is left.
            .text().trim()
        const conceptValueCell = $(conceptRow).find('> td:nth-child(2)')

        // Confirm that this is actual content.
        if (isConceptValueValid(conceptValueCell, $)) {
            const conceptValue = prepareOutput(conceptValueCell, $)
            concepts[conceptName] = conceptValue
        }
    })
    return concepts
}

function getFootnotes(table, $) {
    // Look for links in the concept values.
    const selector = '> tbody > tr > td:nth-child(2) a'
    // Limit to actual footnotes.
    const anchors = $(table).find(selector).filter((idx, a) => isFootnote(a, $))
    // Find the corresponding footnotes.
    const footnotes = $(anchors).map((idx, a) => $($(a).attr('href')))
    // Return the HTML of the list item. (Or do we still want the Cheerio obj?)
    return $(footnotes).map((idx, footnote) => $.html(footnote)).get()
}

function isFootnote(link, $) {
    const href = $(link).attr('href')
    const startsWithHash = href && href.startsWith('#')
    const parentIsSup = link.parent && link.parent.tagName === 'sup'
    return startsWithHash && parentIsSup
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

function isConceptValueValid(input, $) {
    // Microsoft Word can put in some weird stuff. This is a sanity check that
    // we actually have real content.
    const text = $(input).text().replace(/[^\w]/gi, '').trim()
    return text.length > 0
}

function prepareOutput(input, $) {
    const html = $(input).html()
    return HTML.prettyPrint(html.trim())
    //return turndownService.turndown(HTML.prettyPrint(input.trim()))
}

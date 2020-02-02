const gettextParser = require('gettext-parser')
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length < 1) {
  console.log('Please indicate a source file. Example: node txt-to-gettext.js source.txt')
  return
}

// Get a header for a PO file.
function getHeaders(language=null) {
    const headers = {
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding': '8bit'
    }
    if (language) {
        headers['Language'] = language
    }
    return headers
}

// Generate translatable units.
function getUnit(source, target, context=null) {
    source = source.replace(/\r\n/g, "\n")
    const unit = {
        msgid: source,
        msgstr: target
    }
    if (context) {
        unit.msgctxt = context
    }
    return unit
}

// Helper function to a PO file.
function writePo(folder, component, units, targetLanguage=null) {
    const extension = targetLanguage ? '.po' : '.pot'
    const data = {
        headers: getHeaders(targetLanguage),
        translations: {
            "": units
        }
    }
    const fileData = gettextParser.po.compile(data)
    fs.writeFileSync(path.join(folder, component + extension), fileData)
}

const sourceFile = args[0]
const id = args[1]
const source = fs.readFileSync(sourceFile, { encoding: 'utf8' })
const unit = getUnit(source, null, 'foo')
writePo('.', 'txt-to-gettxt', [unit], 'en')

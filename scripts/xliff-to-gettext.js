const xliff12ToJs = require('xliff/xliff12ToJs')
const gettextParser = require('gettext-parser')
const fs = require('fs')
const path = require('path')
const os = require('os')

const sourceFolder = path.join('translations', 'ru')
const destinationFolder = path.join('gettext', 'ru')

const files = fs.readdirSync(sourceFolder)
for (const file of files) {
  const filePath = path.join(sourceFolder, file)
  const xliff = fs.readFileSync(filePath, { encoding: 'utf-8' })
  xliff12ToJs(xliff, (err, res) => {
    const translations = {}
    const xliffKey = Object.keys(res.resources)[0]
    for (const key in res.resources[xliffKey]) {
      translations[key] = {
        msgid: res.resources[xliffKey][key].source
      }
    }
    const po = {
      translations: {
        "": translations
      }
    }
    const fileData = gettextParser.po.compile(po)
    const fileName = xliffKey + '.po'
    fs.writeFileSync(path.join(destinationFolder, fileName), fileData)
  });
}

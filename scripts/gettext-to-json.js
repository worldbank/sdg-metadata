const gettextParser = require('gettext-parser')
const fs = require('fs')
const path = require('path')
const os = require('os')

const baseFolder = 'translations'
const destinationFolder = '_build'
if (!fs.existsSync(destinationFolder)){
  fs.mkdirSync(destinationFolder);
}

const languages = ['en', 'ru']
const output = {}

for (const language of languages) {

  const sourceFolder = path.join(baseFolder, language === 'en' ? 'templates' : language)
  output[language] = {}

  const files = fs.readdirSync(sourceFolder)
  for (const file of files) {
    const filePath = path.join(sourceFolder, file)
    const po = fs.readFileSync(filePath, { encoding: 'utf-8' })
    const parsed = gettextParser.po.parse(po)
    const group = file.split('.')[0]
    output[language][group] = {}

    // Remove headers.
    delete parsed.translations['']

    for (const id of Object.keys(parsed.translations)) {
      const source = Object.keys(parsed.translations[id])[0]
      const target = language === 'en' ? source : parsed.translations[id][source]['msgstr'][0]
      output[language][group][id] = target
    }
  }

  const json = JSON.stringify(output);
  fs.writeFileSync(path.join(destinationFolder, 'translations.json'), json, 'utf8')
}
const builder = require('xmlbuilder')
const gettextParser = require('gettext-parser')
const fs = require('fs')
const path = require('path')
const YAML = require('yaml')
const os = require('os')

const baseFolder = 'translations'
const destinationFolder = '_build'

const languages = ['en', 'ru']
const translations = {}

/*
Example XML

<indicators>
    <indicator id="1.1.1">
        <fields>
            <field id="COLL_METHOD">
                <translations>
                    <translation lang="en">Foo</translation>
                    <translation lang="ru">Bar</translation>
                </translations>
            </field>
        </fields>
    </indicator>
</indicators>
*/

// Construct an object with all the individual translations of fields.
for (const language of languages) {

    const sourceFolder = path.join(baseFolder, language === 'en' ? 'templates' : language)
    translations[language] = {}

    const files = fs.readdirSync(sourceFolder)
    for (const file of files) {
        const filePath = path.join(sourceFolder, file)
        const po = fs.readFileSync(filePath, { encoding: 'utf-8' })
        const parsed = gettextParser.po.parse(po)
        const group = file.split('.')[0]
        translations[language][group] = {}

        // Remove headers.
        delete parsed.translations['']

        for (const id of Object.keys(parsed.translations)) {
            const source = Object.keys(parsed.translations[id])[0]
            const target = language === 'en' ? source : parsed.translations[id][source]['msgstr'][0]
            translations[language][group][id] = target
        }
    }
}

const indicatorIds = Object.keys(translations[languages[0]])
const fieldOrder = YAML.parse(fs.readFileSync(path.join('scripts', 'field-order.yml'), { encoding: 'utf-8' }))

// Start generating the XML document.
const indicators = builder.create('indicators')

for (const indicatorId of indicatorIds) {

    const indicator = indicators.ele('indicator', { id: indicatorId })
    const fields = indicator.ele('fields')

    for (const fieldName of fieldOrder[indicatorId]) {

        const field = fields.ele('field', { id: fieldName })
        const translationsEle = field.ele('translations')

        for (const language of languages) {

            const translation = translationsEle.ele(
                'translation',
                { lang: language },
                translations[language][indicatorId][fieldName]
            )
        }
    }
}

const xml = indicators.end({ pretty: true });

if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder);
}

fs.writeFileSync(path.join(destinationFolder, 'metadata.xml'), xml, 'utf8')

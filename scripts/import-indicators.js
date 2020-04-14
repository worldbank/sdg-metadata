const {
  WordTemplateInput,
  GettextOutput
} = require('sdg-metadata-convert')
const path = require('path')
const fs = require('fs')

const sourceFolder = 'indicators'
const targetFolder = path.join('translations', 'templates')
const files = fs.readdirSync(sourceFolder).filter(file => {
    return path.extname(file).toLowerCase() === '.docx';
})

for (const sourceFile of files) {
    const sourcePath = path.join(sourceFolder, sourceFile)
    const targetFile = sourceFile.replace('.docx', '.pot')
    const targetPath = path.join(targetFolder, targetFile)
    new WordTemplateInput(sourcePath).convertTo(new GettextOutput(targetPath))
}

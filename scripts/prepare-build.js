function usageInstructions() {
    console.log('Please choose "api", "documents", or "site".')
    console.log('Example: node scripts/prepare-build.js api')
    process.exit(1)
}

const args = process.argv.slice(2)
if (args.length < 1) {
    usageInstructions()
}

const buildType = args[0]
let builder = null

if (buildType === 'site') {
    builder = require('./build/site')
}
if (buildType === 'api') {
    builder = require('./build/api')
}
if (buildType === 'documents') {
    builder = require('./build/documents')
}
if (buildType === 'history') {
    builder = require('./build/history')
}

if (builder) {
    builder()
}
else {
    usageInstructions()
}

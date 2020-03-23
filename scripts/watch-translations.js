const watch = require('node-watch');
const siteBuilder = require('./build/site')
const apiBuilder = require('./build/api')
const documentsBuilder = require('./build/documents')

const args = process.argv.slice(2)

function rebuild() {
    siteBuilder(true)
    if (args.length > 0 && args[0] === 'full') {
        apiBuilder(true)
        documentsBuilder(true)
    }
}

watch('translations', { recursive: true }, function(evt, name) {
    rebuild()
    console.log('%s changed. Files rebuilt.', name);
});

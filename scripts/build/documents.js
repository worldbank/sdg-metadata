module.exports = function(refresh=false) {

    const fs = require('fs')
    const path = require('path')
    const convertHTMLToPDF = require("pdf-puppeteer")
    const documentTemplate = require('./document-template')
    const md = require('markdown-it')({
        html: true
    }).use(require('markdown-it-footnote'))
    const store = require('../translation-store')

    if (refresh) {
        store.refresh()
    }

    const destinationFolder = 'www'
    const absoluteUrl = 'https://opendataenterprise.github.io/sdg-metadata'

    // Create folders from an array of parts. Returns the path of the folder.
    function createFolder(folderParts) {
        let folder = '.'
        for (const part of folderParts) {
            folder = folder + path.sep + part
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
        }
        return folderParts.join(path.sep)
    }

    // Get the absolute URL for an image.
    function getImageFolder(language, indicatorId) {
        const path = `/metadata/${language}/${indicatorId}/images`
        return absoluteUrl + path
    }

    // Convert an indicator to fully-rendered HTML.
    function getHtml(indicatorContent, language, indicatorId) {
        let html = '<p>This indicator has not been translated yet.</p>'
        if (indicatorContent.trim()) {
            html = md.render(indicatorContent)
        }
        // Images need to absolute instead of relative.
        const prefix = 'src="'
        const srcSearch = new RegExp(prefix + 'images', 'g')
        const srcReplace = prefix + getImageFolder(language, indicatorId)
        return html.replace(srcSearch, srcReplace)
    }

    // Generate the PDFs.
    function getPuppeteerPdfOptions(lastUpdated) {
        return {
            // See https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagepdfoptions
            displayHeaderFooter: true,
            // Because of Puppeteer (or Chromium?) issues, we have to pass styles
            // in with the footer markup.
            footerTemplate: `
                <style>
                    #footer { padding: 0 !important; }
                    * { box-sizing: border-box; }
                    div.footer {
                        text-align: right;
                        font-size: 10px;
                        height: 30px;
                        width: 100%;
                        margin: 0 50px;
                    }
                </style>
                <div class='footer'>
                    Page: <span class='pageNumber'></span> of <span class='totalPages'></span>
                </div>
            `,
            // Because of Puppeteer (or Chromium?) issues, we have to pass styles
            // in with the header markup.
            headerTemplate: `
                <style>
                    #header { padding: 0 !important; }
                    * { box-sizing: border-box; }
                    div.header {
                        text-align: right;
                        font-size: 10px;
                        height: 50px;
                        width: 100%;
                        margin: 20px 50px 0 50px;
                    }
                </style>
                <div class='header'>
                    Last update: ${ lastUpdated }
                </div>
            `,
            format: 'A4',
            margin: {
                // These numbers tweaked to look OK despite the header/footer issues
                // linked above.
                top: '66px',
                right: '60px',
                bottom: '45px',
                left: '60px',
            },
        }
    }

    // Generate the PDFs.
    const indicatorIds = store.getIndicatorIds()
    const languages = store.getLanguages()
    const pdfs = []
    for (const indicatorId of indicatorIds) {
        for (const language of languages) {
            createFolder([destinationFolder, 'pdf', language])
            const html = getHtml(store.translateAllFields(indicatorId, language), language, indicatorId)
            const lastUpdated = store.translateField(indicatorId, 'META_LAST_UPDATE', language)
            pdfs.push([language, indicatorId, html, lastUpdated])
        }
    }
    processPdf(0)

    // Write a PDF file.
    function processPdf(pdfIndex) {
        if (pdfIndex < pdfs.length) {
            const [language, indicatorId, html, lastUpdated] = pdfs[pdfIndex]
            const fileName = 'Metadata-' + indicatorId + '.pdf'
            const filePath = path.join(destinationFolder, 'pdf', language, fileName)
            const htmlDoc = documentTemplate(indicatorId, html)
            convertHTMLToPDF(htmlDoc, pdf => {
                fs.writeFileSync(filePath, pdf)
                processPdf(pdfIndex + 1)
            }, getPuppeteerPdfOptions(lastUpdated))
        }
    }
}

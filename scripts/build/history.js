module.exports = function() {

    const fs = require('fs')
    const path = require('path')
    const utils = require('./utils')
    const simpleGit = require('simple-git/promise')
    const repo = simpleGit()

    const { WordTemplateInput, Diff } = require('sdg-metadata-convert')
    const wordTemplateInput = new WordTemplateInput()
    const tempRepoPath = 'temp'

    const headerDisclaimer = `
        <p>
            Only updates made by the World Bank Translation Project Team are shown.
            The original source file for all English metadata files is the
            <a href="https://unstats.un.org/sdgs/metadata/">UNSD SDG Metadata Repository</a>.
        </p>
    `
    const renderedHeader = `
        <p>
            This comparison shows additions and deletions to metadata files in simple,
            human-readable format. This view may be helpful to general users.
        </p>
    `
    const sourceHeader = `
        <p>
            This comparison shows additions and deletions to metadata files in detailed
            format. This view may be helpful when precisely updating translations.
        </p>
    `
    const diffStyle = `
        .instructions {
            border: 1px solid black;
            background: lightyellow;
            padding: 20px;
        }
    `

    main()

    async function main() {

        const lastCommit = await repo.revparse('HEAD')
        if (!fs.existsSync(tempRepoPath)) {
            await repo.clone('https://github.com/brockfanning/sdg-metadata', tempRepoPath)
        }
        const tempRepo = simpleGit(tempRepoPath)
        const history = {}
        const targetFolder = utils.createFolder(['www', 'history'])

        const files = fs.readdirSync('indicators').filter(file => {
            const extension = path.extname(file).toLowerCase()
            return ['.docx', '.docm'].includes(extension)
        })
        for (const file of files) {

            await tempRepo.checkout(lastCommit)
            const filePath = path.join('indicators', file)
            const logs = await repo.log({ file: filePath })
            const versions = []
            for (const log of logs.all.reverse()) {
                const metadata = await metadataFromCommit(log.hash, filePath, tempRepo)
                if (metadata != false) {
                    versions.push({ metadata, log })
                }
            }
            if (versions.length < 2) {
                console.log(filePath + ' had only one version. At least two are needed for history.')
                continue
            }
            const slug = file.split('.')[0]
            history[slug] = []
            let oldMeta = null
            let newMeta = null
            for (const version of versions) {
                if (oldMeta == null) {
                    oldMeta = version.metadata
                }
                else if (newMeta == null) {
                    newMeta = version.metadata
                }
                else {
                    oldMeta = newMeta
                    newMeta = version.metadata
                }
                if (oldMeta != null && newMeta != null) {
                    const diff = await new Diff(oldMeta, newMeta)
                    const fileName = slug + '-' + version.log.hash + '.html'
                    const renderedDiff = 'rendered-' + fileName
                    const sourceDiff = 'source-' + fileName
                    diff.writeRenderedHtml(path.join(targetFolder, renderedDiff), {
                        header: '<div class="instructions">' + renderedHeader + headerDisclaimer + '</div>',
                        style: diffStyle,
                    })
                    diff.writeSourceHtml(path.join(targetFolder, sourceDiff), {
                        header: '<div class="instructions">' + sourceHeader + headerDisclaimer + '</div>',
                        style: diffStyle,
                    })
                    history[slug].push({
                        file: file,
                        slug: slug,
                        commit: version.log.hash,
                        date: version.log.date,
                        renderedDiff: renderedDiff,
                        sourceDiff: sourceDiff,
                    })
                }
            }
        }

        const dataFolder = path.join('www', '_data')
        fs.writeFileSync(path.join(dataFolder, 'history.json'), JSON.stringify(history), 'utf8')
    }

    async function metadataFromCommit(commit, filePath, tempRepo) {
        await tempRepo.checkout(commit)
        const tempFilePath = path.join(tempRepoPath, filePath)
        if (!fs.existsSync(tempFilePath)) {
            console.log('Error - file ' + filePath + ' not found in commit ' + commit)
            return false
        }
        const metadata = await wordTemplateInput.read(tempFilePath)
        return metadata
    }
}

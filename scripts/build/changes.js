const { version } = require('os')

module.exports = function() {

    const fs = require('fs')
    const path = require('path')
    const simpleGit = require('simple-git/promise')
    const utils = require('./utils')
    const { YamlInput, Diff } = require('sdg-metadata-convert')
    const repo = simpleGit()
    const tempRepoPath = 'temp'
    const yamlInput = new YamlInput();
    const diffStyle = `
        .instructions {
            border: 1px solid black;
            background: lightyellow;
            padding: 20px;
        }
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

    main()

    async function main() {

        const lastCommit = await repo.revparse(['HEAD'])
        if (!fs.existsSync(tempRepoPath)) {
            await repo.clone('https://github.com/worldbank/sdg-metadata', tempRepoPath)
        }
        const tempRepo = simpleGit(tempRepoPath)
        const history = {}
        const targetFolderForSourceChanges = utils.createFolder(['www', 'source-changes'])
        const targetFolderForRenderedChanges = utils.createFolder(['www', 'source-changes', 'rendered'])

        const sourceFolder = path.join('translations-metadata', 'en');
        const files = fs.readdirSync(sourceFolder).filter(file => {
            const extension = path.extname(file).toLowerCase()
            return ['.yml'].includes(extension)
        })
        for (const file of files) {

            await tempRepo.checkout(lastCommit)
            const filePath = path.join(sourceFolder, file)
            const logs = await repo.log({ file: filePath })
            const versions = []
            for (const log of logs.all) {
                const metadata = await metadataFromCommit(log.hash, filePath, tempRepo)
                if (metadata != false) {
                    versions.push({ metadata, log })
                }
                if (versions.length > 1) {
                    // We only care about the most recent change for now.
                    break;
                }
            }
            if (versions.length < 2) {
                console.log(filePath + ' had only one version. At least two are needed for source changes.')
                continue
            }

            const slug = file.split('.')[0]
            history[slug] = []
            const newVersion = versions[0]
            const oldVersion = versions[1]
            const newMeta = newVersion.metadata
            const oldMeta = oldVersion.metadata

            if (oldMeta != null && newMeta != null) {
                const diff = await new Diff(oldMeta, newMeta)
                const fileName = slug + '.html'
                diff.writeRenderedHtml(path.join(targetFolderForRenderedChanges, fileName), {
                    header: renderedHeader,
                    style: diffStyle,
                })
                diff.writeSourceHtml(path.join(targetFolderForSourceChanges, fileName), {
                    header: sourceHeader,
                    style: diffStyle,
                })
                history[slug].push({
                    file: file,
                    slug: slug,
                    commit: newVersion.log.hash,
                    date: newVersion.log.date,
                    renderedDiff: 'source-changes/' + fileName,
                    sourceDiff: 'source-changes/rendered/' + fileName,
                })
            }
        }

        const dataFolder = path.join('www', '_data')
        fs.writeFileSync(path.join(dataFolder, 'source-changes.json'), JSON.stringify(history), 'utf8')
    }

    async function metadataFromCommit(commit, filePath, tempRepo) {
        await tempRepo.checkout(commit)
        const tempFilePath = path.join(tempRepoPath, filePath)
        if (!fs.existsSync(tempFilePath)) {
            console.log('Error - file ' + filePath + ' not found in commit ' + commit)
            return false
        }
        const metadata = await yamlInput.read(tempFilePath)
        return metadata
    }
}

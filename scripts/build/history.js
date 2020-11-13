const fs = require('fs')
const path = require('path')
const simpleGit = require('simple-git/promise')
const repo = simpleGit()

const { WordTemplateInput, Diff } = require('sdg-metadata-convert')
const wordTemplateInput = new WordTemplateInput()
const tempRepoPath = 'temp'
const outputFolder = 'history'

main()

async function main() {

    const lastCommit = await repo.revparse('HEAD')
    //await repo.clone('https://github.com/brockfanning/sdg-metadata', tempRepoPath)
    const tempRepo = simpleGit(tempRepoPath)
    await tempRepo.checkout(lastCommit)

    for (const file of fs.readdirSync('indicators')) {
        const filePath = path.join('indicators', file)
        const logs = await repo.log({ file: filePath })
        const commits = logs.all.map(l => l.hash).reverse()
        if (commits.length < 2) {
            console.log(filePath + ' had only one version. At least two are needed for history.')
            continue
        }
        const versions = await metadataFromCommits(commits, filePath, tempRepo)
        let oldMeta = null
        let newMeta = null
        for (const version of versions) {
            if (oldMeta == null) {
                oldMeta = version
            }
            else if (newMeta == null) {
                newMeta = version
            }
            else {
                oldMeta = newMeta
                newMeta = version
            }
            if (oldMeta != null && newMeta != null) {
                const diff = await new Diff(oldMeta, newMeta)
                const fileName = file.split('.')[0] + '.html'
                diff.writeRenderedHtml(path.join(outputFolder, fileName))
            }
        }
    }
}

async function metadataFromCommits(commits, filePath, tempRepo) {
    const versions = []
    for (const commit of commits) {
        const version = await metadataFromCommit(commit, filePath, tempRepo)
        versions.push(version)
    }
    return versions
}

async function metadataFromCommit(commit, filePath, tempRepo) {
    await tempRepo.checkout(commit)
    const metadata = await wordTemplateInput.read(path.join(tempRepoPath, filePath))
    return metadata
}

/**
 * This file cycles through all the Git branches in this repository, and for
 * any that start with "snapshot-" will perform a "make build" and add the built
 * site to a subfolder of the "www" folder. This will presumably be followed
 * by a "make build". The end result is a subfolder version of the site for
 * every branch starting with "snapshot-".
 */

const git = require('simple-git')()
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path')

git.branch((err, branchSummary) => {
    if (err) {
        throw err
    }
    const prefix = 'snapshot-'
    const remoteBranches = branchSummary.all.filter(br => isRemoteSnapshot(br, prefix))
    const snapshotsBuild = []
    for (const remoteBranch of remoteBranches) {
        // We have to take some extra steps to make sure the branch is local.
        const branch = getLocalBranch(remoteBranch)
        if (snapshotsBuild.includes(branch)) {
            continue
        }
        snapshotsBuild.push(branch)
        git.fetch('origin', branch + ':' + branch, err => {
            git.clone('.', branch, ['--single-branch', '--branch=' + branch], err => {
                if (err) {
                    throw err
                }

                // Manually turn on the testing banner and override the baseurl.
                const subfolder = branch.replace(prefix, '')
                const baseUrl = '/sdg-metadata/' + subfolder
                const configPath = path.join(branch, 'www', '_config.yml')
                let config = fs.readFileSync(configPath, 'utf8')
                config = config + '\n\nbaseurl: ' + baseUrl
                config = config + '\n\ntest_banner: true\n'
                fs.writeFileSync(configPath, config, 'utf8')

                exec('cd ' + branch + ' && make install && make build', (err, stdout, stderr) => {
                    if (err) {
                        console.error(err)
                    }
                    else {
                        const source = path.join(branch, 'www', '_site')
                        const destination = path.join('www', subfolder)
                        fs.rename(source, destination, function (err) {
                            if (err) {
                                throw err
                            }
                            console.log('Built branch "' + branch + '" and moved to subfolder "' + subfolder + '".')
                        })
                    }
                });
            })
        })
    }
})

function isRemoteSnapshot(branch, prefix) {
    return getLocalBranch(branch).startsWith(prefix)
}

function getLocalBranch(remoteBranch) {
    // Just make sure it's whatever is after the last "/".
    const parts = remoteBranch.split('/')
    return parts[parts.length - 1]
}

/**
 * This is a placeholder for a script to import from a metadata authoring tool.
 */

const fs = require('fs')
const path = require('path')
const filePath = path.join('indicators', 'test.txt')
const fileContents = 'testing'
fs.writeFileSync(filePath, fileContents)

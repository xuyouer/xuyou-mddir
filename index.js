const { Tree, generateTree } = require('./src/Tree')
const { program } = require('commander')
const fs = require('fs')
const { parse } = require('json5')

if (require.main === module) {
    program
        .version('0.1.0')
        .description(
            'Generate a directory tree in markdown format 生成项目结构树',
        )
        .option('-r, --root <path>', 'Root directory 项目目录路径')
        .option('-o, --options <options>', 'Options config {...}', (value) => parse(value))
        .parse(process.argv)

    let { root, options = {} } = program.opts()
    root = root ? root : process.cwd()
    try {
        if (!fs.existsSync(root)) {
            console.error(`Root directory '${root}' does not exist`)
            process.exit(1)
        }
        generateTree(root, options)
    } catch (error) {
        console.error('An error occurred:', error)
    }
}

module.exports = {
    Tree,
    generateTree,
}

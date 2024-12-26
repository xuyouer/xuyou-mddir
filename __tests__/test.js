const { Tree, generateTree } = require('../index')

// const options = {
//     configFilePath: '',
//     ignoreDirs: ['node_modules', 'package.json', '__tests__', '.git'],
//     excludeDirs: [],
//     buildOptions: {
//         keepIgnoredName: true,
//         maxDepth: 5,
//         outputFormat: 'console',
//         showFileSize: false,
//         showIgnoredFileSize: false,
//         appendIgnore: false,
//         appendExclude: false,
//     },
// }
const options = {
    configFilePath: '.ignore.json',
}

// generateTree(__dirname)
// generateTree()
// OR
generateTree(null, options)
// OR
// const tree = new Tree(null, options)
// tree.generateTree()

// const { Tree, generateTree } =  require('xuyou-mddir')
// const tree = new Tree(null, options)
// tree.generateTree()
// generateTree(null, options)
// generateTree()

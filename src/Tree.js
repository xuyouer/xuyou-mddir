const fs = require('fs')
const path = require('path')

class Tree {
    constructor(rootPath = process.cwd(), options = {}) {
        this.rootPath = typeof rootPath === 'string' ? rootPath : process.cwd()
        this.options = {
            configFilePath: '.ignore.json',
            ignoreDirs: [
                'node_modules',
                '.idea',
                '.git',
                '.vscode',
                'build',
                'dist',
                '__tests__',
                'temp',
            ],
            excludeDirs: [],
            projectName: path.basename(this.rootPath),
            buildOptions: {
                keepIgnoredName: false,
                maxDepth: 5,
                outputFormat: 'console',
                showFileSize: false,
                showIgnoredFileSize: false,
            },
        }
        this._loadConfig()
        this.options = {
            ...this.options,
            ...options,
        }
    }

    _loadConfig() {
        const configFilePath = this.options.configFilePath
        try {
            if (fs.existsSync(configFilePath)) {
                const config = JSON.parse(
                    fs.readFileSync(configFilePath, 'utf-8'),
                )
                this._mergeConfig(config)
            }
        } catch (error) {
            console.error(`加载配置文件失败: ${error}`)
        }

        // exclude 优先级高于 ignore
        this.options.ignoreDirs = this.options.ignoreDirs.filter(
            dir => !this.options.excludeDirs.includes(dir),
        )

        return {}
    }

    _mergeConfig(config) {
        if (config.ignore) {
            this.options.ignoreDirs = [
                ...this.options.ignoreDirs,
                ...config.ignore,
            ]
        }
        if (config.exclude) {
            this.options.excludeDirs = [
                ...this.options.excludeDirs,
                ...config.exclude,
            ]
        }
        if (config.buildOptions) {
            this.options.buildOptions = {
                ...this.options.buildOptions,
                ...config.buildOptions,
            }
        }
    }

    generateTreeData(currentPath = null, level = 0) {
        const pathToExplore = currentPath || this.rootPath

        if (!fs.existsSync(pathToExplore)) {
            return []
        }
        if (level > this.options.buildOptions.maxDepth) {
            return []
        }

        const items = fs.readdirSync(pathToExplore)
        items.sort()

        const node = {
            name: path.basename(pathToExplore),
            children: [],
        }

        items.forEach(item => {
            const fullPath = path.join(pathToExplore, item)
            const showSize = this.options.buildOptions.showIgnoredFileSize

            if (this.options.ignoreDirs.includes(item)) {
                if (this.options.buildOptions.keepIgnoredName) {
                    node.children.push({
                        name: item,
                        isDir: fs.lstatSync(fullPath).isDirectory(),
                        size: showSize
                            ? this._formatSize(this._getDirSize(fullPath))
                            : undefined,
                    })
                }
                return
            }
            node.children.push(this._getNodeData(fullPath, level))
        })

        return [node]
    }

    _getNodeData(fullPath, level) {
        const showSize = this.options.buildOptions.showFileSize
        const stats = this._getFileStats(fullPath)
        const node = {
            name: path.basename(fullPath),
            isDir: stats.isDirectory(),
        }
        if (!node.isDir && this.options.buildOptions.showFileSize) {
            node.size = this._formatSize(stats.size)
        }
        if (node.isDir) {
            node.size = showSize
                ? this._formatSize(this._getDirSize(fullPath))
                : undefined
            node.children = this.generateTreeData(fullPath, level + 1)
        }
        return node
    }

    generateTreeConsole(currentPath = null, level = 0) {
        const pathToExplore = currentPath || this.rootPath

        if (
            !this._isValidPath(pathToExplore) ||
            level > this.options.buildOptions.maxDepth
        ) {
            return
        }

        const items = this._getSortedItems(pathToExplore)

        if (level === 0 && this.options.projectName) {
            console.log(`${this.options.projectName}/`)
            console.log('│')
        }

        items.forEach(item => {
            const fullPath = path.join(pathToExplore, item)
            const stats = this._getFileStats(fullPath)

            if (this.options.ignoreDirs.includes(item)) {
                if (this.options.buildOptions.keepIgnoredName) {
                    this._printIgnoredNode(item, level, stats, fullPath)
                }
                return
            }
            this._printNode(item, level, stats, fullPath)
        })

        if (level === 0) {
            console.log('└── ...')
        }
    }

    _printIgnoredNode(item, level, stats, fullPath) {
        const indent = '│   '.repeat(level)
        const showSize = this.options.buildOptions.showIgnoredFileSize

        if (stats.isDirectory()) {
            console.log(
                `${indent}├── ${item}/    ${
                    showSize ? this._formatSize(this._getDirSize(fullPath)) : ''
                }`,
            )
            console.log(`${indent}│   └── ...`)
            console.log(`${indent}│`)
        } else {
            console.log(
                `${indent}├── ${item}    ${
                    showSize ? this._formatSize(stats.size) : ''
                }`,
            )
        }
    }

    _printNode(item, level, stats, fullPath) {
        const indent = '│   '.repeat(level)
        const showSize = this.options.buildOptions.showFileSize

        if (stats.isDirectory()) {
            console.log(
                `${indent}├── ${item}/    ${
                    showSize ? this._formatSize(this._getDirSize(fullPath)) : ''
                }`,
            )
            this.generateTree(fullPath, level + 1)

            if (level > 0 || level === 0) {
                console.log(`${indent}│   └── ...`)
                console.log(`${indent}│`)
            }
        } else {
            console.log(
                `${indent}├── ${item}    ${
                    showSize ? this._formatSize(stats.size) : ''
                }`,
            )
        }
    }

    generateTree(currentPath = null, level = 0) {
        const { outputFormat } = this.options.buildOptions

        if (outputFormat === 'console') {
            this.generateTreeConsole(currentPath, level)
        } else if (outputFormat === 'json') {
            const treeData = this.generateTreeData()
            console.log(JSON.stringify(treeData, null, 2))
        } else {
            console.warn(
                `不支持的输出格式: ${outputFormat}, 使用默认输出格式: console`,
            )
            this.generateTreeConsole(currentPath, level)
        }
    }

    _isValidPath(pathToExplore) {
        try {
            fs.accessSync(pathToExplore)
            return true
        } catch (err) {
            console.error(`路径 '${pathToExplore}' 不存在`)
            return false
        }
    }

    _getSortedItems(pathToExplore) {
        return fs.readdirSync(pathToExplore).sort()
    }

    _getFileStats(fullPath) {
        return fs.statSync(fullPath)
    }

    _formatSize(bytes) {
        if (bytes === 0) return '0 B'
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return (
            parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
        )
    }

    _getDirSize(dirPath) {
        const stats = this._getFileStats(dirPath)
        if (!stats.isDirectory()) {
            return stats.size
        }

        let totalSize = 0
        const files = fs.readdirSync(dirPath)
        // files.forEach(file => {
        //     const fullFilePath = path.join(dirPath, file)
        //     const fileStats = this._getFileStats(fullFilePath)
        //     if (fileStats.isDirectory()) {
        //         totalSize += this._getDirSize(fullFilePath)
        //     } else {
        //         totalSize += fileStats.size
        //     }
        // })
        totalSize = files.reduce((ac, file) => {
            const fullFilePath = path.join(dirPath, file)
            const fileStats = this._getFileStats(fullFilePath)
            return (
                ac +
                (fileStats.isDirectory()
                    ? this._getDirSize(fullFilePath)
                    : fileStats.size)
            )
        }, 0)
        return totalSize
    }
}

module.exports = {
    Tree,
    generateTree: (rootPath, options = {}) => {
        const tree = new Tree(rootPath, options)
        tree.generateTree()
    },
}

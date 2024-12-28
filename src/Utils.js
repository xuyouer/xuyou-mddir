const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

class Utils {
    static emptyObject(obj) {
        return !obj || typeof obj !== 'object' || Object.keys(obj).length === 0
    }

    static uniqueArray(arr) {
        return [...new Set(arr)]
    }

    static mergeConfig(target, source, append) {
        if (!source) return target
        return append ? [...target, ...source] : source
    }

    static mergeArray = (defaults, custom, append) => {
        return append ? [...defaults, ...custom] : custom
    }

    static isValidPath(pathToExplore) {
        try {
            fs.accessSync(pathToExplore)
            return true
        } catch (err) {
            console.error(`路径 '${pathToExplore}' 不存在`)
            return false
        }
    }

    static getSortedItems(pathToExplore) {
        return fs.readdirSync(pathToExplore).sort()
    }

    static getFileStats(fullPath) {
        return fs.statSync(fullPath)
    }

    static parseJsonFile(filePath) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        } catch (error) {
            console.error(`解析配置文件 ${filePath} 失败: ${error}`)
            return {}
        }
    }

    static parseYamlFile(filePath) {
        try {
            return yaml.load(fs.readFileSync(filePath, 'utf-8'))
        } catch (error) {
            console.error(`解析配置文件 ${filePath} 失败: ${error}`)
            return {}
        }
    }

    static formatSize(bytes) {
        if (bytes === 0) return '0 B'
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return (
            parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
        )
    }

    static getDirSize(dirPath) {
        const stats = Utils.getFileStats(dirPath)
        if (!stats.isDirectory()) {
            return stats.size
        }

        let totalSize = 0
        const files = fs.readdirSync(dirPath)
        totalSize = files.reduce((ac, file) => {
            const fullFilePath = path.join(dirPath, file)
            const fileStats = Utils.getFileStats(fullFilePath)
            return (
                ac +
                (fileStats.isDirectory()
                    ? Utils.getDirSize(fullFilePath)
                    : fileStats.size)
            )
        }, 0)
        return totalSize
    }
}

module.exports = {
    Utils,
    objectUtils: {
        emptyObject: Utils.emptyObject,
        uniqueArray: Utils.uniqueArray,
        mergeConfig: Utils.mergeConfig,
        mergeArray: Utils.mergeArray,
    },
    fileSystemUtils: {
        isValidPath: Utils.isValidPath,
        getSortedItems: Utils.getSortedItems,
        getFileStats: Utils.getFileStats,
        parseJsonFile: Utils.parseJsonFile,
        parseYamlFile: Utils.parseYamlFile,
    },
    sizeUtils: {
        formatSize: Utils.formatSize,
        getDirSize: Utils.getDirSize,
    },
}

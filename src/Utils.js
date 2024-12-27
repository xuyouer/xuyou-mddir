const fs = require('fs')
const path = require('path')

class Utils {
    emptyObject(obj) {
        return !obj || typeof obj !== 'object' || Object.keys(obj).length === 0
    }

    uniqueArray(arr) {
        return [...new Set(arr)]
    }

    mergeConfig(target, source, append) {
        if (!source) return target
        return append ? [...target, ...source] : source
    }

    isValidPath(pathToExplore) {
        try {
            fs.accessSync(pathToExplore)
            return true
        } catch (err) {
            console.error(`路径 '${pathToExplore}' 不存在`)
            return false
        }
    }

    getSortedItems(pathToExplore) {
        return fs.readdirSync(pathToExplore).sort()
    }

    getFileStats(fullPath) {
        return fs.statSync(fullPath)
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B'
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return (
            parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
        )
    }

    getDirSize(dirPath) {
        const stats = Utils.prototype.getFileStats(dirPath)
        if (!stats.isDirectory()) {
            return stats.size
        }

        let totalSize = 0
        const files = fs.readdirSync(dirPath)
        totalSize = files.reduce((ac, file) => {
            const fullFilePath = path.join(dirPath, file)
            const fileStats = Utils.prototype.getFileStats(fullFilePath)
            return (
                ac +
                (fileStats.isDirectory()
                    ? Utils.prototype.getDirSize(fullFilePath)
                    : fileStats.size)
            )
        }, 0)
        return totalSize
    }
}

module.exports = {
    Utils,
    objectUtils: {
        emptyObject: Utils.prototype.emptyObject,
        uniqueArray: Utils.prototype.uniqueArray,
        mergeConfig: Utils.prototype.mergeConfig,
    },
    fileSystemUtils: {
        isValidPath: Utils.prototype.isValidPath,
        getSortedItems: Utils.prototype.getSortedItems,
        getFileStats: Utils.prototype.getFileStats,
    },
    sizeUtils: {
        formatSize: Utils.prototype.formatSize,
        getDirSize: Utils.prototype.getDirSize,
    },
}

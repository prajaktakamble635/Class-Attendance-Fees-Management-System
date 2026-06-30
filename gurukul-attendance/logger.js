'use strict'

const fs = require('fs')
const path = require('path')
const winston = require('winston')

const logDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// Day-wise log file: ./logs/adms-YYYY-MM-DD.log
function currentLogFile () {
  const day = new Date().toISOString().slice(0, 10)
  return path.join(logDir, `adms-${day}.log`)
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`
  })
)

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: currentLogFile() }),
  ],
})

module.exports = logger

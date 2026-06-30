// noinspection JSStringConcatenationToES6Template

'use strict'

require('dotenv').config({ path: __dirname + '/.env' })
module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  ZONE: process.env.ZONE,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  SECRET_KEY_ADMIN: process.env.SECRET_KEY_ADMIN,
  SECRET_KEY_USER: process.env.SECRET_KEY_USER,
  API_URL: process.env.API_URL,
  COOKIE_DOMAIN_API: process.env.COOKIE_DOMAIN_API,
  PUBLIC_DOCUMENT_PATH: process.env.PUBLIC_DOCUMENT_PATH,
  ALLOWED_URL: process.env.ALLOWED_URL,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
}

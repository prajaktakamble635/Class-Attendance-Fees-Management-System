const jwt = require('jsonwebtoken')
const { SECRET_KEY_ADMIN } = require('./config')

const withAuth = function (req, res, next) {
  const token =
    req.body.user_auth_token ||
    req.query.user_auth_token ||
    req.cookies.user_auth_token
  if (!token) {
    res.status(401).send('Unauthorized: No token provided')
  } else {
    jwt.verify(token, SECRET_KEY_ADMIN, function (err, decoded) {
      if (err) {
        res.status(401).send('Unauthorized: Invalid token')
      } else {
        req.uid = decoded.uid
        req.uType = decoded.uType
        req.userRole = decoded.userRole
        next()
      }
    })
  }
}

module.exports = withAuth

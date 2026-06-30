const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const rfs = require('rotating-file-stream')
const bodyParser = require('body-parser')
const rateLimit = require('express-rate-limit')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const { NODE_ENV, PORT, ALLOWED_URL, SECRET_KEY_ADMIN } = require('./config')
const wlogger = require('./logger')

const { websiteConfigTbl, userTbl } = require('./sequelize')
const Sequelize = require('sequelize')

const Op = Sequelize.Op
const withAdminAuth = require('./adminMiddleware')
const { handleSequelizeError } = require('./sequelizeErrorHandler')

// const readExcelFromSecondRow = require('./readExcel');

//* Include Router
const publicRoutes = require("./routes/public.routes.js");
const commonRoutes = require("./routes/common.routes.js");
const superAdminRoutes = require("./routes/superAdmin.routes.js")
const parentRoutes = require("./routes/parent.routes.js");
const admsRoutes = require("./routes/adms.routes.js");

const axios = require("axios");
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (Number.isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 900000,
});

const app = express();

const allowedUrls = ALLOWED_URL.split(", ");
const corsOptions = {
  credentials: true,
  origin: allowedUrls,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: "50mb",
    parameterLimit: 50000,
  })
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser());
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"].concat(allowedUrls),
        // Additional directives can be added here
      },
    },
    permissionsPolicy: {
      features: {
        camera: [],
        microphone: [],
        geolocation: [],
        accelerometer: [],
        gyroscope: [],
        magnetometer: [],
        usb: [],
        "interest-cohort": [], // Note that interest-cohort is now deprecated in most contexts
      },
    },
    hidePoweredBy: true,
  })
);

app.use(limiter);

//* troubleshoot log implementation
if (NODE_ENV === "production") {
  // * Create access log file
  const accessLogStream = rfs.createStream("access.log", {
    size: "10M",
    interval: "1d",
    path: path.join(__dirname, "log"),
    compress: "gzip",
  });
  // * setup the logger
  app.use(logger("combined", { stream: accessLogStream }));
} else {
  // * below line is for development purpose only
  app.use(logger("dev"));
}

//* api calling
app.use("/publicApi", publicRoutes);

//* Biometric device (ESSL/ZKTeco ADMS) ingest — public, no admin auth.
//* JSON payloads (from the gurukul-attendance relay) are already parsed by the
//* global bodyParser.json above; raw device text bodies are parsed here.
app.use(
  "/iclock",
  bodyParser.text({ type: ["text/*", "application/octet-stream"], limit: "10mb" }),
  admsRoutes
);

app.get('/api/checkAdminToken', withAdminAuth, function (req, res) {
  res.json({ id: req.uid, uType: req.uType, userRole: req.userRole }).status(200)
})

app.use("/api/publicApi", publicRoutes);
app.use("/api/superAdminApi", withAdminAuth, superAdminRoutes)
app.use("/api/parentApi", withAdminAuth, parentRoutes)
app.use("/api/commonApi", withAdminAuth, commonRoutes);

app.get('/', async function (req, res) {
  const filePath = path.join(__dirname, './views/index.html')
  const fileContent = fs.readFileSync(filePath, 'utf8')
  res.setHeader('Content-Type', 'text/html')
  res.end(fileContent)
})

app.get('/favicon.ico', function (req, res) {
  const options = {
    root: path.join(__dirname, './views'),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }
  const fileName = 'favicon.ico'
  res.sendFile(fileName, options, function (err) {
    if (err) handleSequelizeError(err, res, '/favicon.ico')
  })
})

app.get('/styles.min.css', function (req, res) {
  const options = {
    root: path.join(__dirname, './views'),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }
  const fileName = 'styles.min.css'
  res.sendFile(fileName, options, function (err) {
    if (err) handleSequelizeError(err, res, '/styles.min.css')
  })
})

app.use(function (req, res) {
  res.status(404).json({ error: 'Not Found' })
})

app.use(function (err, req, res, next) {
  if (err instanceof rateLimit.RateLimitExceeded) {
    res.status(429).json({ error: 'Too Many Requests' })
  } else {
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}
    res.status(err.status || 500)
    res.render('error')
  }
})

const port = normalizePort(process.env.PORT || PORT)
app.listen(port, () => {
  wlogger.info(`API listening on port:: ${port}`)
  console.log(`API listening on port: ${port}`)
})

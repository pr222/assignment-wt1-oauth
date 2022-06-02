import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import logger from 'morgan'
import hbs from 'hbs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { router } from './routes/router.js'

/**
 * Runs application server.
 */
const main = async () => {
  const app = express()
  const PORT = process.env.PORT || 5000

  const fullDirectory = dirname(fileURLToPath(import.meta.url))
  const baseURL = process.env.BASE_URL || '/'

  // Set logger.
  app.use(logger('dev'))

  // Set more secure HTTP-headers
  app.use(helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'https://gitlab.lnu.se/', 'https://secure.gravatar.com'],
      'style-src': ["'self'", 'https://fonts.googleapis.com/'],
      'font-src': ["'self'", 'https://fonts.gstatic.com']
    }
  }))

  app.use(express.static(join(fullDirectory, '..', 'public')))

  // Set up view engine
  app.set('view engine', 'hbs')
  app.engine('html', hbs.__express)
  app.set('views', join(fullDirectory, 'views'))
  hbs.registerPartials(fullDirectory + '/views/partials')

  // Enable application/json.
  app.use(express.json())

  // // Middlewares
  const sessionOptions = {
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
      sameSite: 'lax'
    }
  }

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1)
    sessionOptions.cookie.secure = true
  }

  app.use(session(sessionOptions))

  // Set baseURL to access it in views
  app.use((req, res, next) => {
    res.locals.baseURL = baseURL
    //   res.locals.session = req.session
    next()
  })

  // Routes.
  app.use('/', router)

  // Handle error responses.
  app.use(function (err, req, res, next) {
    err.status = err.status || 500

    if (req.app.get('env') !== 'development') {
      const error = {
        status: err.status,
        message: err.message
      }

      return res.render('error', { viewData: error })
    }

    // Details only in dev.
    const error = {
      status: err.status,
      message: err.message,
      innerException: err.innerException,
      stack: err.stack
    }

    return res.render('error', { viewData: error })
  })

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
    console.log('Press Ctrl+C to terminate.')
  })
}

try {
  main()
} catch (err) {
  console.error(err)
}

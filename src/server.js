import express from 'express'
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
  // const baseURL = process.env.BASE_URL || '/'

  // Set logger.
  app.use(logger('dev'))

  // Set more secure HTTP-headers
  app.use(helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'style-src': ["'self'", 'https://fonts.googleapis.com/'],
      'font-src': ["'self'", 'https://fonts.gstatic.com']
    }
  }))

  // TODO: Add cors?

  app.use(express.static(join(fullDirectory, '..', 'public')))

  // Set up view engine
  app.set('view engine', 'hbs')
  app.engine('html', hbs.__express)
  app.set('views', join(fullDirectory, 'views'))
  hbs.registerPartials(fullDirectory + '/views/partials')

  // Enable urlencoding for register/login users.
  // app.use(express.urlencoded({ extended: false }))

  // Enable application/json.
  app.use(express.json())

  // Routes.
  app.use('/', router)

  // Handle error responses.
  app.use(function (err, req, res, next) {
    err.status = err.status || 500

    if (req.app.get('env') !== 'development') {
      return res
        .status(err.status)
        .json({
          status: err.status,
          message: err.message
        })
    }

    // Details only in dev.
    return res
      .status(err.status)
      .json({
        status: err.status,
        message: err.message,
        innerException: err.innerException,
        stack: err.stack
      })
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

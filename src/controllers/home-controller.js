import fetch from 'node-fetch'
import createHttpError from 'http-errors'
import cryptoRandomString from 'crypto-random-string'

/**
 * Encapsulation of controller for home.
 */
export class HomeController {
  /**
   * Present homepage.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next-middleware function.
   */
  async home (req, res, next) {
    try {
      res.render('index', { viewData: { header: 'My Activities App' } })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Perform a login.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next-middleware function.
   */
  async login (req, res, next) {
    try {
      const state = cryptoRandomString({ length: 10, type: 'url-safe' })

      await req.session.regenerate(() => {
        req.session.state = state

        console.log(req.session)
        res.redirect(`${process.env.AUTH_URL}/oauth/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=read_user&state=${state}`)
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Handle Gitlab auth callback.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next-middleware function.
   */
  async callback (req, res, next) {
    try {
      if (req.query.state !== req.session.state) {
        next(createHttpError(401, 'Failed to authorize callback.'))
      }

      const code = req.query.code
      console.log(code)
      const request = await fetch(`${process.env.AUTH_URL}/oauth/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${process.env.REDIRECT_URI}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await request.json()

      console.log(response)

      res.render('index', { viewData: { header: 'Callback' } })
    } catch (error) {
      next(error)
    }
  }
}

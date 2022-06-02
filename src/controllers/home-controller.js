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
      const toView = {
        header: 'My Activities App'
      }

      if (req.session.token) {
        toView.session = 'There is a session!'
      }

      res.render('index', { viewData: toView })
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

      const params = {
        response_type: 'code',
        client_id: `${process.env.CLIENT_ID}`,
        redirect_uri: `${process.env.REDIRECT_URI}`,
        scope: 'read_user',
        state: `${state}`
      }

      const query = new URLSearchParams(params)

      await req.session.regenerate(() => {
        req.session.state = state

        res.redirect(`${process.env.AUTH_URL}/oauth/authorize?${query}`)
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Perform a logout.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next-middleware function.
   */
  async logout (req, res, next) {
    try {
      // Make sure there is a token to revoke.
      if (!req.session.token) {
        return next(createHttpError(404, 'Not Found'))
      }

      const params = {
        client_id: `${process.env.CLIENT_ID}`,
        client_secret: `${process.env.CLIENT_SECRET}`,
        token: req.session.token
      }

      const query = new URLSearchParams(params)

      // Revoke token on gitlab.
      await fetch(`${process.env.AUTH_URL}/oauth/revoke?${query}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Destroy the session to logout the user.
      req.session.destroy()

      res.redirect('/')
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
        next(createHttpError(401, 'Unauthorized'))
      }

      const code = req.query.code

      const params = {
        client_id: `${process.env.CLIENT_ID}`,
        client_secret: `${process.env.CLIENT_SECRET}`,
        code: `${code}`,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.REDIRECT_URI}`
      }

      const query = new URLSearchParams(params)

      const request = await fetch(`${process.env.AUTH_URL}/oauth/token?${query}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await request.json()

      await req.session.regenerate(() => {
        req.session.token = response.access_token

        res.redirect('/')
      })
    } catch (error) {
      next(error)
    }
  }
}

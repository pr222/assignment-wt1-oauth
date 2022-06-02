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
      // Set default value to the view.
      const toView = {
        header: 'My Activities App'
      }

      // With an active session, add all data to present to the view.
      if (req.session.token) {
        const token = req.session.token

        // Get user data.
        const userRequest = await fetch(`${process.env.AUTH_URL}/api/v4/user`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
        const userResponse = await userRequest.json()

        const user = {
          name: userResponse.name,
          username: userResponse.username,
          id: userResponse.id,
          email: userResponse.email,
          last_activity_on: userResponse.last_activity_on,
          avatar: userResponse.avatar_url
        }

        // Set user info to the view.
        toView.user = user

        // Handle pagination numbers.
        let currentPage

        if (!req.query.page) {
          currentPage = 1
        } else {
          currentPage = Number(req.query.page)
        }

        // Set page values for the view.
        toView.currentPage = currentPage
        toView.nextPage = currentPage + 1

        if (currentPage > 1) {
          toView.previousPage = currentPage - 1
        }

        // Get event data
        const eventRequest = await fetch(`${process.env.AUTH_URL}/api/v4/users/${userResponse.id}/events?per_page=50&page=${currentPage}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
        const eventResponse = await eventRequest.json()

        const events = []

        eventResponse.forEach(event => {
          const slimmedEvent = {
            action_name: event.action_name,
            event_id: event.id,
            project_id: event.project_id,
            created_at: event.created_at.split('T')[0]
          }

          events.push(slimmedEvent)
        })

        // Set events to the view.
        toView.events = events
        toView.hits = events.length
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

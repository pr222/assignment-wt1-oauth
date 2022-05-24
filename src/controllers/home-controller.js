// import createHttpError from 'http-errors'

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
      res.redirect(`https://gitlab.lnu.se/oauth/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=read_user&state=mangoes`)
    } catch (error) {
      next(error)
    }
  }
}

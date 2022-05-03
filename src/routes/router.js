import express from 'express'
import createError from 'http-errors'

export const router = express.Router()

router.use('/', (req, res, next) => res.render('index', { viewData: 'World!' }))

router.use('*', (req, res, next) => {
  return next(createError(404, 'Not Found'))
})

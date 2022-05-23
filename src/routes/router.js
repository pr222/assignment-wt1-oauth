import express from 'express'
import createError from 'http-errors'
import { router as homeRouter } from './home-router.js'

export const router = express.Router()

router.use('/', homeRouter)

router.use('*', (req, res, next) => {
  return next(createError(404, 'Not Found'))
})

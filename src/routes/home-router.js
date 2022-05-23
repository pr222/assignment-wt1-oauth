import express from 'express'

export const router = express.Router()

router.use('/', (req, res, next) => res.render('index', { viewData: { header: 'My Activities App' } }))

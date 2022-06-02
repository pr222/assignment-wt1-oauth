import express from 'express'
import { HomeController } from '../controllers/home-controller.js'

export const router = express.Router()

const controller = new HomeController()

// Visit main page.
router.get('/', (req, res, next) => controller.home(req, res, next))

// Initiate login through gitlab.
router.get('/login', (req, res, next) => controller.login(req, res, next))

// Handle logout.
router.get('/logout', (req, res, next) => controller.logout(req, res, next))

// Handle callback to get access token and complete login.
router.get('/callback', (req, res, next) => controller.callback(req, res, next))

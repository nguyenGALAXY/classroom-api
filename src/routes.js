import express from 'express'
import path from 'path'
import { requireDir } from './utils/index'

const router = express.Router()

const classes = requireDir(path.join(__dirname, './controllers'), ['base.js'])
const controllers = classes.map((controller) => new controller.default())
for (const controller of controllers) {
  router.use(controller.router)
}

export default router

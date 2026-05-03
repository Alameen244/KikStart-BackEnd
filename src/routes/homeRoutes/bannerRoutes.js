import {
  createBanner,
  addHeading,
  getActiveBanner,
  getAllBannersForAdmin,
  deleteBanner,
  updateBanner
} from '../../controllers/HomeControllers/bannerController.js'
import express from 'express'
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";
const bannerRouter = express.Router()

// import {deleteBannerImage} from '../../controllers/HomeControllers/bannerController.js'

bannerRouter.get('/', getActiveBanner)
bannerRouter.get('/admin', authMiddleware, checkPermission("Home Content", "read"), getAllBannersForAdmin)
bannerRouter.post('/', authMiddleware, checkPermission("Home Content", "create"), createBanner)
bannerRouter.post('/heading/:id', authMiddleware, checkPermission("Home Content", "update"), addHeading)
bannerRouter.delete('/:id', authMiddleware, checkPermission("Home Content", "delete"), deleteBanner)
bannerRouter.put('/:id', authMiddleware, checkPermission("Home Content", "update"), updateBanner)
// bannerRouter.delete('/image', deleteBannerImage)

export default bannerRouter

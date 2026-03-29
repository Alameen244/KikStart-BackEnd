import {
  createBanner,
  addHeading,
  getActiveBanner,
  getAllBannersForAdmin,
  deleteBanner,
  updateBanner
} from '../../controllers/HomeControllers/bannerController.js'
import express from 'express'
const bannerRouter = express.Router()

// import {deleteBannerImage} from '../../controllers/HomeControllers/bannerController.js'

bannerRouter.get('/', getActiveBanner)
bannerRouter.get('/admin', getAllBannersForAdmin)
bannerRouter.post('/', createBanner)
bannerRouter.post('/heading/:id', addHeading)
bannerRouter.delete('/:id', deleteBanner)
bannerRouter.put('/:id', updateBanner)
// bannerRouter.delete('/image', deleteBannerImage)

export default bannerRouter

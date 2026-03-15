import {createBanner,addHeading,deleteBannerImage,getBanner , deleteBanner,updateBanner} from '../../controllers/HomeControllers/bannerController.js'
import express from 'express'
const bannerRouter = express.Router()

bannerRouter.post('/', createBanner)
bannerRouter.post('/heading', addHeading)
bannerRouter.delete('/image', deleteBannerImage)
bannerRouter.get('/', getBanner)
bannerRouter.delete('/', deleteBanner)
bannerRouter.put('/', updateBanner)
export default bannerRouter

import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router=Router()

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    registerUser)
router.route('/login').post(
    loginUser
)
router.route("/logout").post(verifyJWT,logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route('/get-count/:username').post(verifyJWT,getUserChannelProfile)
router.route('/watch-history').post(verifyJWT,getWatchHistory)
router.route('current-user').get(verifyJWT,getCurrentUser)
router.route('update-details').patch(verifyJWT,updateAccountDetails)
router.route('/avatar').patch(verifyJWT,upload.single('avatar'),updateUserAvatar)
export default router;
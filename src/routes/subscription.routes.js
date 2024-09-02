import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    subscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT);

router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
    .post(subscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router
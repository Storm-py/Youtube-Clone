import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const subscription=asyncHandler(async (req,res)=>{
    let { channelId } = req.params;
    channelId = channelId.trim();
    if (!channelId) throw new ApiError(400, "Channel not found");

    let checkSubscribe = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "channelSubscribers"
            }
        },
        {
            $addFields: {
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user._id, "$channelSubscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                isSubscribed: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ]);

    
    if (!checkSubscribe[0].isSubscribed) {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        });
        res.status(200).json(
            new ApiResponse(200, true, "You have subscribed successfully")
        );
    } else {
        await Subscription.findOneAndDelete({ subscriber: req.user._id, channel: channelId });
        res.status(200).json(
            new ApiResponse(200, false, "You have unsubscribed successfully")
        );
    }
    if (checkSubscribe.length === 0) {
        throw new ApiResponse(404,{}, "Channel not found or no subscribers data");
    }
})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    const Subscribers= await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                }
            }
        },
        {
            $project:{
                subscribersCount:1
            }
        }
    ])
    if(Subscribers.length == 0) throw new ApiResponse(400,{},"No subscribers")
    else res.status(200).json( new ApiResponse(200,{Subscribers},"Fetched Successfully"))
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscribedTo= await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribedToChannelsCount:{
                    $size:"$subscribedTo"
                }
            }
        },
        {
            $project:{
                subscribedToChannelsCount:1
            }
        }
    ])
    if(subscribedTo.length == 0) throw new ApiError(400,"Some Problem Occured")
    else res.status(200).json( new ApiResponse(200,{subscribedTo},"Fetched Successfully"))
})

export {
    subscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
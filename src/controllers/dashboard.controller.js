import mongoose from "mongoose"
import {User} from '../models/user.model.js'
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelStats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: '_id',
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: '_id',
                foreignField: "channel",
                as: "totalSubscribers"
            }
        },
        {
            $unwind: "$videos"
        },
        {
            $lookup: {
                from: "likes",
                localField: "videos._id",
                foreignField: "video",
                as: "videos.likes"
            }
        },
        {
            $group: {
                _id: "$_id",
                totalVideos: { $sum: 1 },
                totalSubscribers: { $first: { $size: "$totalSubscribers" } },
                totalLikesOnVideos: { $sum: { $size: "$videos.likes" } },
                totalViewsOnVideos:{$sum:{$size:"$videos.views"}}
            }
        },
        {
            $project: {
                totalVideos: 1,
                totalSubscribers: 1,
                totalLikesOnVideos: 1,
                totalViewsOnVideos:1
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, { channelStats }, "Channel stats fetched successfully")
    );
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const videos= await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:'_id',
                foreignField:"owner",
                as:"channelvideos"
            }
        },
        {
            $project:{
                channelvideos:1
            }
        }
    ])
    if(!videos) throw new ApiError(400,"Something went wrong")
    res.status(200).json(
        new ApiResponse(200,{videos},"Channel Videos fetched sucessfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }
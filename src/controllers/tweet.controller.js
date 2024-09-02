import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content}=req.body
    if(!content) throw new ApiError(400,"Please add something in the Tweet")

    const comment=await Tweet.create(
        {
            content,
            owner:req.user._id,
        }
    )
    if(!comment) throw new ApiError(400,"Tweet Failed")
    res.status(200).json(
        new ApiResponse(200,{comment},"Tweet Added Successfully")
)
})

const getUserTweets = asyncHandler(async (req, res) => {
    const tweets=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },
    ])
    res.status(200).json(
        new ApiResponse(200,{tweets},"Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {content}=req.body
    const {tweetId}=req.params
    if(!content) throw new ApiError(400,"Please add something in the Tweet")
    const tweet=await Tweet.findById(tweetId)
    tweet.content=content
    tweet.save()
    res.status(200).json(
        ApiResponse(200,{},"Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId}=req.params
    await Tweet.findByIdAndDelete(tweetId)
    res.status(200).json(
        ApiResponse(200,{},"Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
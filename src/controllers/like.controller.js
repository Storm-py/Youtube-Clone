import mongoose, {isValidObjectId} from "mongoose"
import {Video} from '../models/video.model.js'
import {User} from '../models/user.model.js'
import {Comment} from '../models/comment.model.js'
import {Tweet} from '../models/tweet.model.js'
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId) throw new ApiError(400,"Video not found")
    const likeAvailable =await Video.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likes"
        }
    },
    {
        $addFields:{
            isLiked:{
                $cond:{
                    if: { $in: [req.user._id, "$likes.likedBy"] },
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            isLiked:1
        }
    }
])
console.log(likeAvailable)
    if(!likeAvailable[0].isLiked){
        const like= await Like.create({
            video:videoId,
            likedBy:req.user._id
        })
        res.status(200).json(
            new ApiResponse(200, true, "You have liked successfully")
        );
    }
    else {
        await Like.findOneAndDelete({video:videoId });
        res.status(200).json(
            new ApiResponse(200, false, "You have removed your like successfully")
        )}
    if (likeAvailable.length === 0) {
        throw new ApiResponse(404,{}, "THis video has zero Likes");
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId) throw new ApiError(400,"Comment not found")
    const checkComment= await Like.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(commentId)
            }
        }
    ])
    console.log(checkComment)
    if(!checkComment) throw new ApiError(400,"Comment not found")
        const commentAvailable =await Comment.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },
        {
            $addFields:{
                isLiked:{
                    $cond:{
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                isLiked:1
            }
        }
    ])

        if(!commentAvailable[0].isLiked){
             await Like.create({
                comment:commentId,
                likedBy:req.user._id
            })
            res.status(200).json(
                new ApiResponse(200, true, "You have liked successfully")
            );
        }
        else {
            await Like.findOneAndDelete({comment:commentId });
            res.status(200).json(
                new ApiResponse(200, false, "You have removed your like successfully")
            )}
        if (commentAvailable.length === 0) {
            throw new ApiResponse(404,{}, "This comment has zero Likes");
        }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId) throw new ApiError(400,"tweet not found")
        const tweetAvailable =await Tweet.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likes"
            }
        },
        {
            $addFields:{
                isLiked:{
                    $cond:{
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                isLiked:1
            }
        }
    ])

        if(!tweetAvailable[0].isLiked){
             await Like.create({
                tweet:tweetId,
                likedBy:req.user._id
            })
            res.status(200).json(
                new ApiResponse(200, true, "You have liked successfully")
            );
        }
        else {
            await Like.findOneAndDelete({tweet:tweetId });
            res.status(200).json(
                new ApiResponse(200, false, "You have removed your like successfully")
            )}
        if (tweetAvailable.length === 0) {
            throw new ApiResponse(404,{}, "This tweet has zero Likes");
        }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likedBy",
                as: "videos"
            }
        },
        {
            $unwind: "$videos"
        },
        {
            $match: {
                "videos.video": { $ne: null }
            }
        },
        {
            $project: {
                videos: 1
            }
        },
        {
            $group: {
                _id: "$_id",
                videos: { $push: "$videos" }
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, { likedVideos }, "Liked videos fetched successfully")
    );
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
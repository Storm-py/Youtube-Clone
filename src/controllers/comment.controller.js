import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const comments=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        }
    ])
    res.status(200).json(
        new ApiResponse(200,{comments},"Comments fetched Successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId}=req.params
    const {content}=req.body
    if(!videoId) throw new ApiError(400,"Video not Found")
    if(!content) throw new ApiError(400,"Please add something in the comment")

    const comment=await Comment.create(
        {
            content,
            video:videoId,
            owner:req.user._id,
        }
    )
    if(!comment) throw new ApiError(400,"Comment Failed")
    res.status(200).json(
        new ApiResponse(200,{comment},"Comment Added Successfully")
)

})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    const {content}=req.body
    if(!commentId) throw new ApiError(400,"Comment not found")
    if(!content) throw new ApiError(400,"Please add Something in the comment ")
    
    const comment=await Comment.findById(commentId)
    if(!comment) throw new ApiError(400,"Comment not found")
    comment.content=content;
    await comment.save({validateBeforeUser:false})
    res.status(200).json(
        new ApiResponse(200,{comment},"Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    if(!commentId) throw new ApiError(400,"Comment not found")
    const comment=await Comment.findByIdAndDelete(commentId)
    res.status(200).json(
        new ApiResponse(200,{comment},"Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  page=Number(page)
  limit=Number(limit) 
  let skip= (page-1) * limit
  let allVideos
  if(!query){
    allVideos=await Video.find().skip(skip).limit(limit)
  }
  
  const searchCriteria={
    $or:[
      {title:{$regex:query,$options:'i'}},{description:{$regex:query,$options:'i'}}
    ]
  }
  let videos;
  if(query){
      if(!searchCriteria) throw new ApiError(400,"No Videos Found")
      videos=await Video.find(searchCriteria).skip(skip).limit(limit)
      if(videos.length==0) throw new ApiError(400,"No Videos Found on this keyword")
  }
  res.status(200).json(
    new ApiResponse(200,{videos,allVideos},"Video Fetched Successfully")
  )
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description)
    throw new ApiError(400, "Title or Description is missing");
  const videoFileLocalPath = req.files.videoFile[0].path;

  if (!videoFileLocalPath) throw new ApiError(400, "Video file not provided");
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  const thumbnailFileLocalPath = req.files.thumbnail[0].path;
  if (!thumbnailFileLocalPath)
    throw new ApiError(400, "Thumbnail not provided");
  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
  

  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: videoFile.url,
    duration: videoFile.duration,
    owner: req.user._id
  });
  res
    .status(200)
    .json(new ApiResponse(200, { video }, "Video Uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!videoId) throw new ApiError(400,"Id not found")
  const video= await Video.findById(videoId)
  if(!video) throw new ApiError(400,"Video not found")
  const checkView=await Video.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(videoId)
      }
    },
    {
     $addFields:{
      isViewed:{
        $cond:{
          if:{$in:[req.user._id,"$views"]},
          then:true,
          else:false
        }
      }
     }
    },
    {
      $project:{
        isViewed:1
      }
    }
])
  if(checkView[0].isViewed){
    res.status(200).json(
      new ApiResponse(200,true,"User has already viewed this video")
    )
  }
  if(!checkView[0].isViewed){
    video.views.push(req.user._id)
   await video.save()
    res.status(200).json(new ApiResponse(200,checkView,"User View Added to the video"))
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const {title,description}=req.body
  if(!videoId) throw new ApiError(400,"Video not found")
  if(!title || !description) throw new ApiError(400,"Title or description is missing")
  const video=await Video.findById(new mongoose.Types.ObjectId(videoId))
  video.title=title
  const thumbnailLocalPath=req.file.path
  let thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
  video.thumbnail=thumbnail.url
  video.description=description
  await video.save({validateBeforeUser:false})
  res.status(200)
  .json(
    new ApiResponse(200,{video},"Details changed successfully")
  )
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!videoId) throw new ApiError(400,"Please provide video id")
  const video=await Video.findById(new mongoose.Types.ObjectId(videoId))
  await Video.deleteOne(video)
  deleteFromCloudinary(video)
  res.status(200).json(
    new ApiResponse(200,{},"Video deleted successfully")
  )
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
};

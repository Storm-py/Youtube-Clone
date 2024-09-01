import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {deleteFromCloudinary, uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const generateAccessAndRefreshTokens=async (userId)=>{
    try{
        const user= await User.findById(userId)
        const accessToken=  user.generateRefreshToken()
        const refreshToken= user.generateAccessToken()

        user.refreshToken=refreshToken
        user.accessToken=accessToken
        await user.save({ validateBeforeSave:false })

        return{accessToken,refreshToken}
    }catch{
        throw new ApiError(500,"Something went wrong While generating Tokens")
    }
}
const registerUser=asyncHandler(async (req,res)=>{
    const {fullName,email,username,password}=req.body
    if(
        [fullName,email,username,password].some((field)=>{
            field?.trim()==""
        })
    ){
        throw new ApiError(400,"All fields are required")
    }

   const existedUser=await User.findOne({
        $or: [{ username },{ email }]
    })
    if(existedUser) throw new ApiError(409,"You have to register through a new Usernmae or Email")

    const avatarLocalPath= req.files?.avatar[0]?.path;
    // const coverImageLocalPath= req.files?.coverImage[0]?.path ;
    console.log(req.files)

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    if(!avatarLocalPath) {throw new ApiError(400,"Avatar Required")}

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) throw new ApiError('400',"Avatar not Uploaded")

    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        username:username.toLowerCase(),
        password,
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser) throw new ApiError(500,"Something went wrong while registering the user")
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Created Successfully")
)
})
const loginUser=asyncHandler(async (req,res)=>{

    const {username,email,password}=req.body

    if(!username && !email) throw new ApiError(400,"Username or Email is required")

    const user=await User.findOne({
        $or:[{username},{email}]
     })

    if(!user) throw new ApiError(400,"User does not Exist")
    
    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid) throw new ApiError(400,"Your Password is not valid")
    
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

  const loggedInUser= await User.findById(user._id).select
    ("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        },
        "User Logged In Successfully"
    )
    )
})
const logoutUser=asyncHandler(async (req,res)=>{
    const user=await req.user._id
    await User.findByIdAndUpdate(
        user,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User logged Out"))
})
const refreshAccessToken=asyncHandler(async (req,res)=>{
    const incomingRefreshToken= req.cookies?.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken) throw new ApiError(401,"You dont have the token")
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id)
        if(!user) throw new ApiError(401,"Invlaid Refresh Token")
        if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401,"Refresh Token is expired or Used")
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,{accessToken,newRefreshToken},"Access Token Refreshed")
        )
    } catch (error) {
        throw new ApiError(400,error?.message)
    }
})
const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) throw new ApiError(400,"Invalid Old Password")
    user.password=newPassword
    user.save({validateBeforeSave:false})
    return res.status(200)
    .json(
        new ApiResponse(200,{},"Password Changed Successfully")
    )

})
const getUserChannelProfile=asyncHandler(async (req,res)=>{
    const {username}=req.query || req.params
    if(!username?.trim()) throw new ApiError(400,"User not Available")
    const channel=await User.aggregate([
    {
        $match:{
            username:username?.toLowerCase()
        },
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
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }
    },
    {
        $addFields:{
            subscribersCount:{
                $size:"$subscribers"
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in: [req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            fullName:1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
        }
    }
])
    if(!channel?.length){
        throw new ApiError(400,"Channel does not exist")
    }
    return res.status(200)
    .json(
        new ApiResponse(200,channel[0],"User Channel Fetched Successfully")
    )
})
const getWatchHistory=asyncHandler(async (req,res)=>{
    
    const user= await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"Watch history Fetched Successfully"))
})
const getCurrentUser=asyncHandler(async (req,res)=>{
    const user=await User.findById(req.user._id)
    console.log(user)
    if(!user) throw new ApiError(200,"User not Found")
    return res.status(200).json(
        new ApiResponse(200,{user},"User Fetched Successfully")
    )
})
const updateAccountDetails=asyncHandler(async (req,res)=>{
    const {fullName,email,username}=req.body
    const user=await User.findById(req.user._id)
    if(!fullName || !email || !username) throw new ApiError(400,"All fields cant be empty")
    if(fullName){
        user.fullName=fullName;
    }
    else if(email){
        user.email=email
    }
    else if(username){
        user.username= username
    }
    user.save({validateBeforeSave:false})
    return res.status(200).json(
        new ApiResponse(200,{},"User details changed Successfully")
    )
})
const updateUserAvatar=asyncHandler(async (req,res)=>{
    const user=await User.findById(req.user._id)
    let avatar=user.avatar
    
    await deleteFromCloudinary(avatar) 
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath) throw new ApiError(400,"Avatar file is missing")
    avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar) throw new ApiError(400,"file not found")
    user.avatar=avatar.url
    await user.save()
    return res.status(200).json(
        new ApiResponse(200,{avatar},"Avatar changed Successfully")
)
})
export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getUserChannelProfile,
    getWatchHistory,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar
}
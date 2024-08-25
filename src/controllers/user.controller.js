import asyncHandler from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {uploadOnCLoudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const registerUser=asyncHandler(async (req,res)=>{
    const {fullName,email,username,password}=req.body
    console.log('email :',email)
    if(
        [fullName,email,username,password].some((field)=>{
            field?.trim()==""
        })
    ){
        throw new ApiError(400,"All fields are required")
    }

   const existedUser= User.findOne({
        $or: [{ username },{ email }]
    })
    if(existedUser) throw new ApiError(409,"You have to register through a new Usernmae or Email")

    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverImageLocalPath=req.files?.avatar[0]?.path 

    if(!avatarLocalPath) throw new ApiError(400,"Avatar Required")

    const avatar=await uploadOnCLoudinary(avatarLocalPath)
    const coverImage=await uploadOnCLoudinary(coverImageLocalPath)

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

export {registerUser}
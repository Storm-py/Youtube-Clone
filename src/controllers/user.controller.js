import asyncHandler from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {uploadOnCLoudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const generateAccessAndRefreshTokens=async (userId)=>{
    try{
        const user= await User.findById(userId)
        const accessToken=  user.generateRefreshToken()
        const refreshToken= user.generateAccessToken()

        user.refreshToken=refreshToken
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

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenght > 0 ){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {throw new ApiError(400,"Avatar Required")}

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
const loginUser=asyncHandler(async (req,res)=>{
    //Getting the details from the User
    //Checking if the username is valid
    //Checking if the password works on that username
    //Getting the username and its password from the Database
    //If both are correct then give response of the user 
    //Giving refresh Token and activate Token to the user
    //Login using Tokens


    const {email,username,password}=req.body

    if(!username || !email) throw new ApiError(400,"Username or Email is required")

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
    .cookie("refeshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        }),
        "User Loggin In Successfully"
    )
})
const logoutUser=asyncHandler(async (req,res)=>{
    const user=await req.user._id
    await User.findByIdAndUpdate(
        user,
        {
            $set:{
                refreshToken:undefined
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
export {registerUser,
    loginUser,
    logoutUser
}
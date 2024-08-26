import { User } from '../models/user.model';
import jwt from 'jsonwebtoken'
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";

export const verifyJWT=asyncHandler(async (req,res,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Beared ","")
        if(!token) throw new ApiError(400,"Unauthorized Request")
       const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodedToken._id).select(
            "-password -refreshToken"
    )
    if(!user) throw new ApiError(401,"Invalid Access Token")
        req.user=user;
    next
    } catch (error) {
        console.log("Error :", error)
        throw new ApiError(401,"Invalid Access Token")
    }
})

import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import { ApiError } from "./ApiError.js";

cloudinary.config({ 
    cloud_name: 'dq9ggzi8h', 
    api_key: '473739513497693', 
    api_secret: '-BOscKVwt8jO8SZ0-LuoTVTec0I'
});

const uploadOnCLoudinary=async (localFilePath)=>{
    try{
        if(!localFilePath)return null
        const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        fs.unlinkSync(localFilePath)
        return response
    }catch(error){
        console.log(error)
        fs.unlinkSync(localFilePath)
        return null
    }
}
const deleteFromCloudinary=async(localFilePath)=>{
    try {
        if (!localFilePath) throw new ApiError(400,"Path not Available")
        const response=await cloudinary.uploader.destroy(localFilePath,(error,result)=>{
            console.log(error,result)
    })
        return response
    } catch (error) {
        console.log(error)
        return null
    }
}

export {uploadOnCLoudinary,deleteFromCloudinary}
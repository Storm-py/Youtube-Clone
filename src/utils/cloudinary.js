import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import { ApiError } from "./ApiError.js";

cloudinary.config({ 
    cloud_name: 'dq9ggzi8h', 
    api_key: '473739513497693', 
    api_secret: '-BOscKVwt8jO8SZ0-LuoTVTec0I'
});

const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath)return null
        const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        if(!response) throw new ApiError(400,"Response is empty")
        fs.unlinkSync(localFilePath)
        return response
    }catch(error){

        return null
    }
}
const deleteFromCloudinary=async(localFilePath)=>{
        
    try {
        let new_url=localFilePath.split('/').pop()
        localFilePath=new_url.split('.')[0]
        if (!localFilePath) throw new ApiError(400,"Path not Available")
        const response=await cloudinary.uploader.destroy(localFilePath,(error,result)=>{
            console.log(error,result)
    })
        return response
    } catch (error) {
        return null
    }
}

export {uploadOnCloudinary,deleteFromCloudinary}
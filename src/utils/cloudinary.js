import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from 'fs'

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCLoudinary=async (localFilePath)=>{
    try{
        if(!localFilePath)return null
        const reponse= await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        console.log('File is uploaded on CLoudinary',response.url)
        return response
    }catch{
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCLoudinary}
import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name || !description) throw new ApiError(400,"Name or Description is missing")
    const playlist=Playlist.create({
        name,
        description,
        owner:req.user._id
})
    if(!playlist) throw new ApiError(400,"Something Went Wrong")
    res.status(200).json(
        new ApiResponse(200,{playlist},"Playlist created sucessfully")
)
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!userId) throw new ApiError(400,"User not found")
    const playlists=await Playlist.find({owner:userId})
    if(!playlists) throw new ApiError(400,"Playlist not available")
    res.status(200).json(
        new ApiResponse(200,{playlists},"Playlists Fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId) throw new ApiError(400,"User not found")
        const playlist=await Playlist.findOne({_id:playlistId})
        if(!playlist) throw new ApiError(400,"Playlist not available")
        res.status(200).json(
            new ApiResponse(200,{playlist},"Playlist Fetched successfully")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId) throw new ApiError(400,"playlistId or videoId is missing")
    const playlist=await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(400,"Playlist not Found")
    playlist.videos.push(videoId)
    playlist.save();
    res.status(200).json(
        new ApiResponse(200,{playlist},"Video added successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId) throw new ApiError(400,"playlistId or videoId is missing")
    const playlist=await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(400,"Playlist not Found")
    const videoIndex = playlist.videos.findIndex(video => video.toString() === videoId);
    if (videoIndex === -1) throw new ApiError(404, "Video not found in playlist");
    playlist.videos.splice(videoIndex,1)
    playlist.save();
    res.status(200).json(
        new ApiResponse(200,{playlist},"Video removed successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId) throw new ApiError(400,"User not found")
        const playlist=await Playlist.findOneAndDelete({_id:playlistId})
        if(!playlist) throw new ApiError(400,"Playlist not available")
        res.status(200).json(
            new ApiResponse(200,{playlist},"Playlist Deleted successfully")
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!playlistId) throw new ApiError(400,"User not found")
        if(!name || !description) throw new ApiError(400,"Name or Description is missing")
        const playlist=await Playlist.findOne({_id:playlistId})
        if(!playlist) throw new ApiError(400,"Playlist not available")
        playlist.name=name;
        playlist.description=description
        await playlist.save()
        res.status(200).json(
            new ApiResponse(200,{playlist},"Playlist Deleted successfully")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
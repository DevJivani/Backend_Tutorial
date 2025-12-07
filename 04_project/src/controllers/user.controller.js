import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    // req.body contains user details from frontend
    const {username, email, password, fullName} = req.body;
    console.log(req.body);
    // console.log(username);


    if ( [fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existingUser) {
        throw new ApiError(409, "User already exists with this username or email")
    }

    // check for images in req.files , multer middleware will help to handle file upload and store in temp folder, take the path of that file 
    
    console.log("files ", req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        console.log("Length:",req.files.coverImage.length);
        
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    

    // upload to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object and store in db

    const user =await User.create({
        username: username.toLowerCase(),
        email,
        password,   
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }


    // return res.status(201).json({
    //     success: true,
    //     message: "User registered successfully",
    //     data: createUser
    // })

    // above code not write in every where so we can create a class in utils folder ApiResponse.js and use that class here

    res.status(201).json(
        new ApiResponse(200, createUser, "User registered successfully")
    )

})

export {registerUser};
import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// when we generate access and referesh token we need the user id

const generateAccessAndRefereshTokens = async (userId) => {
    try{
        console.log("Generating tokens for user id:", userId);
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found while generating tokens");
        }

        const accessToken= user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        console.log("accesstoken",accessToken);
        console.log("refreshtoken",refreshToken);

        
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        console.log(user);

        return {accessToken, refreshToken}
    }
    catch(error){
        console.error("Error generating tokens:", error);
        throw new ApiError(500, error?.message || "Error generating tokens")
    }
}



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

const loginUser = asyncHandler(async (req,res)=>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {username, email, password} = req.body;


    if(!username && !email){
        throw new ApiError(400, "Username or email is required to login")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)



    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password")
    }

    console.log(isPasswordValid);
    console.log(user._id);
    
    
    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // by default cookie is modifiable from frontend javascript code so to avoid that we set httpOnly to true and secure to true means only https

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200, loggedInUser, "User logged in successfully")
    )
});

const logoutUser = asyncHandler(async (req,res)=>{
    // first approach

    // const user =  await User.findById(req.user._id)
    // user.refreshToken = null
    // await user.save({validateBeforeSave: false})

    // second approach

    await User.findByIdAndUpdate(req.user._id, 
        {
             $set:{
                refreshToken: undefined
             }
        }, 
        {
            new: true,  // return the updated document
        })

    const options = {
        httpOnly: true,
        secure: true
    }

     return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


export {registerUser,loginUser,logoutUser,refreshAccessToken};
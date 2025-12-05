import dotenv from "dotenv"
import connectDb from "./db/index.js"
import { app } from "./app.js";


dotenv.config({
    path:'./.env'
})


//first mongodb connection successfull then server listen the app
connectDb()
.then(()=>{
    app.listen(process.env.PORT || 4000,()=>{
        console.log(`server running at port:${process.env.PORT}`);
        
    })
})
.catch((error)=>{
    console.log("MongoDb Connection Failed:",error);
    
})


















// other way , in this database connection code write in main index.js file

/*
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv"
import { DB_NAME } from "./constant.js";

dotenv.config({
    path:'./.env'
})

const app = express();

async function connectDb(){
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("Database connected successfully : ");

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
        
    } catch (error) {
        console.log("Mongodb connection failed :",error);
        throw error;
        
    }
}

connectDb();
*/
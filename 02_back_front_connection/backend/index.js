import express from "express";

const app = express()

const port = process.env.PORT || 4000

app.get('/',(req,res)=>{
    res.send("hello world");
})

app.get('/api/jokes',(req,res)=>{
    const jokes = [
        {
            id : 1,
            content : "First Joke"
        },
        {
            id : 2,
            content : "second Joke"
        },
        {
            id : 3,
            content : "third Joke"
        },
        {
            id : 4,
            content : "fourth Joke"
        },
        {
            id : 5,
            content : "fifth Joke"
        },
    ]

    res.json(jokes)
})

app.listen(port,()=>{
    console.log(`Port is listen at http://localhost:${port}`);
    
})
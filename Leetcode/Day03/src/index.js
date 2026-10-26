const express = require('express')
const app = express();
require('dotenv').config();
const main = require('./config/database');
const cookieParser = require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisclient = require('./config/redis');

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);

const InitailizeConnection = async()=>{
    try{
        await Promise.all([main(),redisclient.connect()]);
        console.log("DB connected")

        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })
    }
    catch(err){
        console.log("Error: "+err);
    }
}
InitailizeConnection();


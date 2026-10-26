const express = require('express')
const app = express();
require('dotenv').config();
const main = require('./config/database');
const cookieParser = require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisclient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const userMiddleware = require('./middleware/userMiddleware');
const submitCodeRateLimiter = require('./middleware/submitCodeRateLimiter');
const cors = require('cors');

app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))

app.use(express.json());
app.use(cookieParser());



app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission',userMiddleware,submitCodeRateLimiter,submitRouter);


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



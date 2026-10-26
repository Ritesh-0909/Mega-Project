const redisClient = require("../config/redis");
const User = require("../modules/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require ('jsonwebtoken'); 
const Submission = require("../modules/submission");   


const register = async(req,res)=>{
    try{
        // Validate the data
        validate(req.body);

        const{firstName, emailId, password}=req.body;

        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'user';
        //

        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id, emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn:60*60});
        const reply={
            firstName:user.firstName,
            emailId:user.emailId,
            _id:user._id,
            role:req.result.role
        }
        res.cookie('token',token,{maxAge:60*60*1000});
        res.status(201).json({
            user:reply,
            message:"User Registered Successfully"
        })
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const login = async(req,res)=>{
    try{
        const{emailId,password}=req.body;
        
        if(!emailId)
            throw new Error ("Invalid credentials");
        if(!password)
            throw new Error ("Invalid credentials");
        
        const user = await User.findOne({emailId});

        const match = bcrypt.compare(password,user.password);

        if(!match)
            throw new Error("Invalid credentials");

        const reply={
            firstName:user.firstName,
            emailId:user.emailId,
            _id:user._id
        }
         
        const token = jwt.sign({_id:user._id, emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn:60*60});
        res.cookie('token',token,{maxAge:60*60*1000});
        res.status(201).json({
            user:reply,
            message:"Login Successfully"
        })
    }
    catch(err){
        res.status(401).send("Error: "+err);

    }
}

const logout = async(req,res)=>{
    try{
        const {token} = req.cookies;
        // Token add kar dungaa Redis me blocklist me daal dunga
        const payload = jwt.decode(token);

        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);

        // Cookies ko clear kar dena
        res.cookie("token",null,{expires:new Date(Date.now())});
        res.send("Logged Out successfully");
    }
    catch(err){
        res.status(503).send("Error: "+err)
    }
}

const adminRegister = async(req,res)=>{
    try{
        // Validate the data
        validate(req.body);

        const{firstName, emailId, password}=req.body;

        req.body.password = await bcrypt.hash(password, 10);
       
        //

        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id, emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn:60*60});
        res.cookie('token',token,{maxAge:60*60*1000});
        res.status(201).send("User registered successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }    
}

const deleteProfile = async(req,res)=>{
    try{
        const userId = req.result._id;

        // userSchema delete
        await User.findByIdAndDelete(userId);

        // Submission se delete karo
        await Submission.deleteMany({userId});

        res.status(200).send("Deleted Successfully");
    }
    catch(err){
        res.status(500).send("Internal Server Error");
    }
}



module.exports = {register,login,logout,adminRegister,deleteProfile };
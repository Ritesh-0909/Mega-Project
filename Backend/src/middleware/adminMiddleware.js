const jwt = require("jsonwebtoken")
const User = require("../modules/user")
const redisClient = require("../config/redis")


const adminMiddleware = async(req,res,next)=>{
    try{
        const {token} = req.cookies;
        if(!token)
            throw new Error("Token is not present");

        const payload = jwt.verify(token,process.env.JWT_KEY);
        const{_id} = payload;
        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if(payload.role!='admin')
            throw new Error("Invalid Token")

        if(!result){
            throw new Error("User doesn't exist");
        }

        // Redis ke blocklist me toh present nhi hai 
        const IsBlocked = await redisClient.exists(`token:${token}`);
        if(IsBlocked)
            throw new Error("Invalid Token");
        req.result = result;

        next();
    }
    catch(err){
        res.status(401).send("Error: "+err);
    }
}

module.exports = adminMiddleware;













// const jwt = require("jsonwebtoken");
// const User = require("../modules/user");
// const redisClient = require("../config/redis");

// const adminMiddleware = async (req, res, next) => {
//     try {
//         const token = req.cookies?.token;

//         if (!token) {
//             return res.status(401).json({
//                 error: "Token is missing. Please log in again."
//             });
//         }

//         const payload = jwt.verify(token, process.env.JWT_KEY);

//         if (!payload._id) {
//             return res.status(401).json({
//                 error: "Invalid token payload."
//             });
//         }

//         const result = await User.findById(payload._id);

//         if (!result) {
//             return res.status(401).json({
//                 error: "User does not exist."
//             });
//         }

//         if (result.role !== "admin") {
//             return res.status(403).json({
//                 error: "Admin access required.",
//                 role: result.role
//             });
//         }

//         const isBlocked = await redisClient.exists(`token:${token}`);

//         if (isBlocked) {
//             return res.status(401).json({
//                 error: "Token has been blocked. Please log in again."
//             });
//         }

//         req.result = result;
//         next();

//     } catch (err) {
//         console.error("Admin authentication error:", err.message);

//         return res.status(401).json({
//             error: err.name === "TokenExpiredError"
//                 ? "Session expired. Please log in again."
//                 : "Authentication failed. Check your login session."
//         });
//     }
// };

// module.exports = adminMiddleware;

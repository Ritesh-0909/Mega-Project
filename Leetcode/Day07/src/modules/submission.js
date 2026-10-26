const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissiomSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    problemId:{
        type:Schema.Types.ObjectId,
        ref:'Problem',
        required:true
    },
    code:{
        type:String,
        required:true
    },
    language:{
        type:String,
        required:true,
        enum:['javascript', 'python','cpp','c','typescript']
    },
    status:{
        type:String,
        enum:['pending','accepted','wrong','error'],
        default:'pending'
    },
    runtime:{
        type:Number,
        default:0
    },
    memory:{
        type:Number,
        default:0
    },
    errorMessage:{
        type:String,
        default:''
    },
    testCasesPassed:{
        type:Number,
        default:0
    },
    testCasesTotal:{
        type:Number,
        default:0
    }
},{
    timestamps:true
});


const Submission = mongoose.model('submission',submissiomSchema);
module.exports = Submission;
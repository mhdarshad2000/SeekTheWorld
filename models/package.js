const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const packageSchema = new Schema({
    name:String,
    category:{
            type:Schema.Types.ObjectId,
            ref:'categories'
    },
    price:{
        adult:Number,
        child:Number
    },
    description:String,
    countries:[
        {
            type:String
        }
    ],
    days:{
        type:String
    },
    Image:{
        type:Array
    },
    wishlists: [{
        type:Schema.Types.ObjectId,
        ref:'users'
}],
    isDeleted:Boolean,
    createdDate:Date,
    deletedDate:Date
})
module.exports = mongoose.model("Package",packageSchema)

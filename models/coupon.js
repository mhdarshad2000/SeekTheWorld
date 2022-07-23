const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    couponName:String,
    couponCode:String,
    offer:Number,
    createdDate:Date,
    expiryDate:Date,
    image:Array,
    limit:Number,
    isDeleted :Boolean,
    users:[{
        type: Schema.Types.ObjectId,
        ref:'users'
    }]
})
module.exports = mongoose.model("Coupon",couponSchema)
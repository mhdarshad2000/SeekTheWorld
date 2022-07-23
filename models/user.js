const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:String,
    email:String,
    phone:Number,
    password:String,
    role:Boolean,
    isBlocked:Boolean,
    passportNumber:String,
    wallet:'Number',
    booking: [{
            paymentRef:String,
            refundId:String,
            adultsCount : Number,
            childsCount : Number,
            boardingDate : Date,
            returnDate : Date,
            totalPrice:Number,
            paymentStatus:String,
            status : String,
            bookingDate:String,
            cancelledDate:String,
            package : {
                type:Schema.Types.ObjectId,
                ref:'packages'
            }  
    }],
    Banner:{
        hero_title:String,
        images:Array,
        hero_button:String
    },
    address:{
        house:String,
        place:String,
        post:String,
        pinCode:Number,
        city:String,
        district:String,
        state:String
    },
    profileImage:Array
})
module.exports = mongoose.model("User",userSchema)

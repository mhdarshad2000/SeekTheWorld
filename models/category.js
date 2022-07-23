const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    categoryName:String,
    isDeleted:Boolean,
    updatedDate:Date,
    deletedDate:Date
})
module.exports = mongoose.model("Category",categorySchema)

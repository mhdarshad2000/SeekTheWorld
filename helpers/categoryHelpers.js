var db = require('../config/connections')
var Category = require('../models/category')
const mongoose = require('mongoose')


module.exports = {
    getCategory: () => {
        return new Promise((resolve, reject) => {
            try{
            let category = Category.
                aggregate([{
                    $match: { isDeleted: false }
                },
                {
                    $project: {
                        _id: 1,
                        categoryName: 1
                    }
                }])
            resolve(category)
            }
            catch(error){
                reject(error)
                }
        })
    },
    addCategory : (category)=>{
        let name=category.cat
        let valid={}
        return new Promise(async(resolve,reject)=>{
            try{
            let catCheck = await Category.findOne({categoryName:category.cat})
            if(catCheck){
                valid.exist = true
                resolve(valid)
            }else{
            await Category.create({categoryName:name,
                isDeleted:false,
                updatedDate:new Date()
            })
            resolve(valid)
            }
        }catch(error){
            reject(error)
        }
        })
        

    },
    deleteCategory : (cat_id)=>{
        let id = mongoose.Types.ObjectId(cat_id)
        return new Promise((resolve,reject)=>{
            try{
            Category.updateOne({_id:id},{
                $set:{
                    isDeleted:true,
                    deletedDate:new Date()}
                }).then(()=>{
            })
        }catch(error){
            reject(error)
        }
        })
    },
    editCategory : (cate_id,edcategory)=>{

        const edid = mongoose.Types.ObjectId(cate_id)
        return new Promise(async(resolve,reject)=>{
            try{
            const catExist = await Category.findOne({categoryName:edcategory.category})
            if(!catExist){
            await Category.updateOne({_id:edid},{
                $set:{
                    categoryName:edcategory.category,
                    updatedDate:new Date()
                }
            })
            resolve(catExist)
            }else{
                console.log('error')
            }
            }catch(error){
                reject(error)
            }
            
        })
    },
    deletedCategories : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let deleted = await Category.aggregate([
                { $match: 
                    { isDeleted: true } }, 
                { $sort: 
                    { deletedDate: -1 } }, 
                { $project: 
                    { __v: 0, updatedDate: 0, 
                    isDeleted: false, 
                    deletedDate: 0 } 
                }
            ])
            resolve(deleted)
            }catch(error){
                reject(error)
            }
        })
    },
    restoreCategory : (res_id)=>{
        let resid = mongoose.Types.ObjectId(res_id)
        return new Promise((resolve,reject)=>{
            try{
            Category.updateOne({_id:resid},{
                $set:{
                    isDeleted:false}
                }).then(()=>{

            })
        }catch(error){
            reject(error)
        }
        })
    },
    
}
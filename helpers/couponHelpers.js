var db = require('../config/connections')
const Coupon = require('../models/coupon')
const Mongoose = require('mongoose')
const Moment = require('moment')
module.exports = {
    addCoupon: (coupon, image) =>{
        return new Promise(async(resolve, reject) => {
            let status={}
            const couponImage = image[0].filename
            const couponExist = await Coupon.findOne({couponName:coupon.couponName})
            if(!couponExist){
            let newCoupon = await new Coupon({
                couponName: coupon.couponName,
                couponCode : coupon.couponCode,
                offer: coupon.offer,
                createdDate: new Date(),
                limit:coupon.limit,
                expiryDate: coupon.expiry,
                image: couponImage,
                isDeleted : false
            })
            await newCoupon.save(async (err, result) => {
                if (err) {
                    console.log('insertion failed' + err)
                } else {
                    resolve(coupon)
                }
            })
        }else{
            status.exist=true
            resolve(status)

        }
        })
    },
    getCoupon : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            const coupons = await Coupon.aggregate([{$match:{isDeleted:false,expiryDate:{'$gt':new Date()}}},
                {$project:{
                created: { $dateToString: { format: "%Y-%m-%d", date: '$createdDate' } },
                expiry: {$dateToString: {format: "%Y-%m-%d", date: '$expiryDate'}},
                image:1,
                offer:1,
                _id:1,
                limit:1,
                couponName:1,
                couponCode:1
            }}])
            resolve(coupons)
        }catch(error){
            reject(error)
        }
        })
    },
    fetchCoupon: (coupon)=>{
        const couponId = Mongoose.Types.ObjectId(coupon)
        return new Promise(async(resolve,reject)=>{
            try{
            const fetchedCoupon = await Coupon.aggregate([{$match:{
                _id:couponId,isDeleted:false
            }},{
                $project:{
                    _id:1,
                    couponName:1,offer:1,
                    expiry: {$dateToString: {format: "%Y-%m-%d", date: '$expiryDate'}},
                    image:1,
                    limit:1,
                    couponCode:1
                }
            }])
            console.log(fetchedCoupon)
            resolve(fetchedCoupon)
            }catch(error){
                reject(error)
            }
        })
    },
    updateCoupon : (couponId,coupon, image)=>{
        const updateCouponId = Mongoose.Types.ObjectId(couponId)
        return new Promise(async(resolve,reject)=>{
            try{
            let status={}
            const couponImage = image[0].filename 
            const couponExist = await Coupon.findOne({couponName:coupon.couponName})
            if(!couponExist){
                const couponUpdate = await Coupon.updateOne({_id:updateCouponId},{
                    $set:{
                       couponName:coupon.couponName,
                       couponCode:coupon.couponCode,
                       expiryDate:coupon.expiry,
                       image:couponImage,
                       limit:coupon.limit,
                       offer:coupon.offer 
                    }
                })
                resolve(couponUpdate)
            }else{
                status.exist=true
                resolve(status)
            }
        }catch(error){
            reject(error)
        }
        })
    },
    deleteCoupon : (couponId)=>{
        return new Promise(async(resolve,reject)=>{
            try{
            const coupon = Mongoose.Types.ObjectId(couponId)
            const deleteCoupon = await Coupon.updateOne({_id:coupon},{
                $set:{isDeleted:true}
            })
            resolve(deleteCoupon)
        }catch(error){
            reject(error)
        }
        })
    },
    useCoupon : (userId,couponId)=>{
        let status ={}
        const user = Mongoose.Types.ObjectId(userId)
        const coupon = Mongoose.Types.ObjectId(couponId)
        return new Promise(async(resolve,reject)=>{
            try{
            const isUsed = await Coupon.aggregate([
                {
                  '$match': {
                    'users': {
                      '$in': [
                        user
                      ]
                    }, 
                    '_id': coupon,
                  }
                }
              ])
              if(isUsed.length==0){
                const couponDetails = await Coupon.findOne({_id:coupon,isDeleted:false})
                resolve(couponDetails)
              }else{
                status.used=true
                resolve(status)
            }
        }catch(error){
            reject(error)
        }
        })
    },
    changeCouponStatus : (userId,couponId)=>{
        const coupon = Mongoose.Types.ObjectId(couponId)
        const user = Mongoose.Types.ObjectId(userId)
        return new Promise(async(resolve,reject)=>{
            try{
            useCoupon = await Coupon.updateOne({
                _id:coupon,
                isDeleted:false},
                { $push: 
                    { users: user }
                })
                resolve(useCoupon)
                }catch(error){
                    reject(error)
                }
        })
    }
}
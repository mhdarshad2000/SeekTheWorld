var db = require('../config/connections')
const mongoose = require('mongoose')
const User = require('../models/user')
const Package = require('../models/package')
const moment = require('moment')

module.exports={
    countUsers : ()=>{
        return new Promise(async(resolve,reject)=>{
          try{
            const countBlockedUsers = await User.find({role:false,isBlocked:true}).count()
            const countUnBlockedUsers = await User.find({role:false,isBlocked:false}).count()
            const countUsersResult = {countBlockedUsers,countUnBlockedUsers}
            resolve(countUsersResult)
          }catch(error){
            reject(error)
          }
        })
    },
    countBookings : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            const countTotalBookings = await User.aggregate([
                {
                    '$match': {
                        'isBlocked': false,
                        role:false
                    }
                }, {
                    '$unwind': {
                        'path': '$booking'
                    }
                }, {
                    '$match': {
                        'booking.paymentStatus': 'Paid'
                    }
                }
            ])
            resolve(countTotalBookings)
        }catch(error){
            reject(error)
        }
        })
        
    },
    packages : () =>{
        return new Promise(async(resolve,reject)=>{
            try {
                const packages = await Package.find({isDeleted:false}).count()
                resolve(packages)
            } catch (error) {
                reject(error)
            }
        })
    },
    totalRevenue : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
                const totalRevenueEarned = await User.aggregate([
                    {
                      '$match': {
                        'isBlocked': false, 
                        'role': false
                      }
                    }, {
                      '$unwind': {
                        'path': '$booking'
                      }
                    },{
                      '$group': {
                        '_id': '', 
                        'total': {
                          '$sum': '$booking.totalPrice'
                        }, 
                        'count': {
                          '$sum': 1
                        }
                      }
                    }
                  ])
                  resolve(totalRevenueEarned)
            }catch(error){
                reject(error)
            }
        })
    },
    todaySale : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
               const today = new Date()
               const date = moment(today).format("YYYY-MM-DD")
                const todayRevenue = await User.aggregate([
                    {
                      '$match': {
                        'role': false
                      }
                    }, {
                      '$unwind': {
                        'path': '$booking'
                      }
                    }, {
                      '$match': {
                        'booking.bookingDate': date
                      }
                    }, {
                      '$group': {
                        '_id': '', 
                        'total': {
                          '$sum': '$booking.totalPrice'
                        }, 
                        'count': {
                          '$sum': 1
                        }
                      }
                    }
                  ])
                  resolve(todayRevenue)
            }catch(error){
                reject(error)
            }
        })
    },
    totalCancels : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
                const totalCancels = await User.aggregate([
                    {
                      '$unwind': {
                        'path': '$booking'
                      }
                    }, {
                      '$match': {
                        'booking.paymentStatus': 'Refunded'
                      }
                    }, {
                      '$group': {
                        '_id': '', 
                        'count': {
                          '$sum': 1
                        }, 
                        'total': {
                          '$sum': '$booking.totalPrice'
                        }
                      }
                    }
                  ])
                  resolve(totalCancels)
            }catch(error){
                reject(error)
            }
        })
    },
    todayCancels : ()=>{
        return new Promise(async(resolve,reject)=>{
            const today = moment(new Date()).format("YYYY-MM-DD")
            try{
                const todayCancel = await User.aggregate([
                    {
                      '$unwind': {
                        'path': '$booking'
                      }
                    }, {
                      '$match': {
                        'booking.paymentStatus': 'Refunded', 
                        'booking.cancelledDate': today
                      }
                    }, {
                      '$group': {
                        '_id': '', 
                        'total': {
                          '$sum': '$booking.totalPrice'
                        }, 
                        'count': {
                          '$sum': 1
                        }
                      }
                    }
                  ])
                  resolve(todayCancel)
            }catch(error){
            reject(error)
            }
        })
    },
    paymentPie : ()=>{
      return new Promise(async(resolve,reject)=>{
        try{
          let payment = []
          const paid = await User.aggregate([
            {
              '$unwind': {
                'path': '$booking'
              }
            }, {
              '$match': {
                'booking.paymentStatus': 'Paid'
              }
            }, {
              '$group': {
                '_id': '', 
                'paid': {
                  '$sum': '$booking.totalPrice'
                }
              }
            }
          ])
          payment.push(paid[0].paid)
          const values = await User.aggregate([
            {
              '$unwind': {
                'path': '$booking'
              }
            }, {
              '$match': {
                'booking.paymentStatus': 'Refunded'
              }
            }, {
              '$group': {
                '_id': '', 
                'refund': {
                  '$sum': '$booking.totalPrice'
                }
              }
            }
          ])
          payment.push(values[0].refund)
          
          resolve(payment)
        }catch(error){
          reject(error)
        }
      })
    },
    categoryPrice : ()=>{
      return new Promise(async(resolve,reject)=>{
        try{
          const categoryTotal = await User.aggregate([
            {
              '$match': {
                'role': false
              }
            }, {
              '$unwind': {
                'path': '$booking'
              }
            }, {
              '$lookup': {
                'from': 'packages', 
                'localField': 'booking.package', 
                'foreignField': '_id', 
                'as': 'package'
              }
            }, {
              '$unwind': {
                'path': '$booking.package'
              }
            }, {
              '$lookup': {
                'from': 'categories', 
                'localField': 'package.category', 
                'foreignField': '_id', 
                'as': 'category'
              }
            }, {
              '$unwind': {
                'path': '$category'
              }
            }, {
              '$group': {
                '_id': '$category.categoryName', 
                'total': {
                  '$sum': '$booking.totalPrice'
                }
              }
            }
          ])
          resolve(categoryTotal)
        }catch(error){
          reject(error)
        }
      })
    },
    dailyRevenue : ()=>{
      return new Promise(async(resolve,reject)=>{
        try{
          const daily= User.aggregate([
            {
              '$unwind': {
                'path': '$booking'
              }
            }, {
              '$match': {
                'booking.paymentStatus': 'Paid'
              }
            }, {
              '$group': {
                '_id': '$booking.bookingDate', 
                'total': {
                  '$sum': '$booking.totalPrice'
                }
              }
            }
          ])
          resolve(daily)
        }catch(error){
          reject(error)
        }
      })
    }
}
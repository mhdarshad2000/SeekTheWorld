var db = require('../config/connections')
const mongoose = require('mongoose')
var Package = require('../models/package')
var Category = require('../models/category')
const User = require('../models/user')

module.exports = {
  addPackage: (package, files) => {

    return new Promise(async (resolve, reject) => {
      let category = await Category.findOne({ _id: package.Category })
      {
        if (category) {
          let newPackage = await new Package({
            name: package.Name,
            category: category,
            'price.adult': package.adult,
            'price.child': package.child,
            description: package.Description,
            days: package.Duration,
            Image: files,
            isDeleted: false,
            createdDate: new Date()
          })
          await newPackage.save(async (err, result) => {
            if (err) {
              console.log('insertion failed' + err)
            } else {
              resolve(result)
            }
          })
        }
      }
    })



  },

  getPackages: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
      const user = mongoose.Types.ObjectId(userId)
      let getPackage = await Package.aggregate([
        {
          '$match': {
            'isDeleted': false
          }
        }, {
          '$lookup': {
            'from': 'categories',
            'localField': 'category',
            'foreignField': '_id',
            'as': 'category'
          }
        }, {
          '$unwind': {
            'path': '$category'
          }
        }, {
          '$match': {
            'category.isDeleted': false
          }
        },{
          '$addFields': {
            'isWished': {
              '$cond': [
                {
                  '$in': [
                    user, '$wishlists'
                  ]
                }, true, false
              ]
            }
          }
        }
      ])
      resolve(getPackage)
    }catch(error){
      reject(error)
    }
    })
  },
  newPackages: () => {
    return new Promise(async (resolve, reject) => {
      const newPackage = await Package.aggregate([{
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      }, {
        $unwind: '$category'
      }, {
        $project: {
          __v: 0
        }
      }, {
        $sort:
          { createdDate: -1 }
      },{$limit:6}])
      resolve(newPackage)
    })
  },
  fetchPackage: (id) => {
    let package_id = mongoose.Types.ObjectId(id)
    return new Promise(async (resolve, reject) => {
      let pack = await Package.aggregate([{ $match: { _id: package_id, isDeleted: false } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',

          as: 'category'
        }
      }, {
        $unwind: "$category"
      }, {
        $project: {
          name: 1,
          category: 1,
          price: 1,
          description: 1,
          days: 1,
          Image: 1
        }
      }])
      resolve(pack)
    })
  },
  editPackage: (packageId, packageDetails, files) => {
    var editPackage
    const package = mongoose.Types.ObjectId(packageId)
    return new Promise(async (resolve, reject) => {
      const editPackageFind = await Package.findOne({
        _id: package
      })
      if (editPackageFind) {
        let category = mongoose.Types.ObjectId(packageDetails.Category)
        if (files.length == 0) {
          editPackage = await Package.updateOne({ _id: package }, {
            $set: {
              name: packageDetails.Name,
              category: category,
              'price.adult': packageDetails.adult,
              'price.child': packageDetails.child,
              description: packageDetails.Description,
              days: packageDetails.Duration,
            }
          })
        } else {
          editPackage = await Package.updateOne({ _id: package }, {
            $set: {
              name: packageDetails.Name,
              category: category,
              'price.adult': packageDetails.adult,
              'price.child': packageDetails.child,
              description: packageDetails.Description,
              days: packageDetails.Duration,
              Image: files,
            }
          })
        }
        resolve(editPackage)
      }
    })
  },


  deletePackage: (Id) => {
    let delId = mongoose.Types.ObjectId(Id)
    return new Promise(async (resolve, reject) => {
      let delet = await Package.updateOne({ _id: delId }, {
        $set: {
          isDeleted: true
        }
      })
      resolve(delet)
    })
  },
  filterPackage: (filterData, user) => {
    const filterPrice = Number(filterData.price)
    const filterCategory = filterData.category
    const userId = mongoose.Types.ObjectId(user)
    return new Promise(async (resolve, reject) => {
      if (filterData.category.length > 1) {
        const filter = await Package.aggregate([
          {
            '$match': {
              'isDeleted': false
            }
          }, {
            '$lookup': {
              'from': 'categories',
              'localField': 'category',
              'foreignField': '_id',
              'as': 'category'
            }
          }, {
            '$unwind': {
              'path': '$category'
            }
          }, {
            '$match': {
              'category.isDeleted': false
            }
          },
          {
            '$match': {
              'category.categoryName': {
                '$in': filterCategory
              }
            }
          }, {
            $match: {
              'price.adult': { $lte: filterPrice }
            }
          },{
            '$addFields': {
              'isWished': {
                '$cond': [
                  {
                    '$in': [
                      userId, '$wishlists'
                    ]
                  }, true, false
                ]
              }
            }
          }
        ])

        resolve(filter)
      } else {
        const filter = await Package.aggregate([{ $match: { 'price.adult': { $lte: filterPrice } } }])
        resolve(filter)

      }
    })
  },

  getPack: (pId) => {
    const id = mongoose.Types.ObjectId(pId)
    return new Promise(async (resolve, reject) => {
      const package = await Package.aggregate([
        {
          $match:
            { _id: id, isDeleted: false }
        }, {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        }
      ])

      resolve(package[0])
    })
  },

  relatedPackage : (categoryId)=>{
    return new Promise(async(resolve,reject)=>{
      const relatedCategoryId = mongoose.Types.ObjectId(categoryId._id)
      const related = await Package.aggregate([{$match:{isDeleted:false}},{$lookup:{
        from:'categories',
        localField:'category',
        foreignField:'_id',
        as:'category',
      }},{
        $unwind:'$category'
      },{
        $match:{'category.isDeleted':false,'category._id':relatedCategoryId}
      }])
      resolve(related)
    })
  },

  searchPackage: (searchKey) => {
    return new Promise(async (resolve, reject) => {
      const searchResult = await Package.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: '$category'
        },{
          $match:{"name":{
            "$regex": searchKey
          }}
        }
      ])
    })
  },
  isCompletedBooking : (userId,packageId)=>{
    return new Promise(async(resolve,reject)=>{
      try{
        const user = mongoose.Types.ObjectId(userId)
        const package = mongoose.Types.ObjectId(packageId)
        const completed = await User.aggregate([
          {
            '$unwind': {
              'path': '$booking'
            }
          }, {
            '$match': {
              'booking.package': package, 
              '_id': user,
              'booking.paymentStatus':"Paid",
              'booking.returnDate':{'$gt':new Date()},              
            }
          }
        ])
        resolve(completed)
      }catch(error){
        reject(error)
      }
    }
    )
  },
  postReview : (reviewData,userId)=>{
    return new Promise(async(resolve,reject)=>{
      try{
        console.log(reviewData)
        const packageId = mongoose.Types.ObjectId(reviewData.package)
        const user = mongoose.Types.ObjectId(userId)
        const review = await Package.updateOne({_id:packageId},{
          //add to set is used
          $addToSet:{reviews:{
            user:user,
            ratings:reviewData.rate,
            reviews:reviewData.review,
            date:new Date()
          }
          }
        })
        console.log(review)
        resolve(review)
      }catch(error){
        reject(error)
      }
    })
  },
  getReviews : (packageId)=>{
    return new Promise(async(resolve,reject)=>{
      try{
        const package= mongoose.Types.ObjectId(packageId)
        const reviews = await Package.aggregate([
          {
            '$match': {
              '_id': package
            }
          }, {
            '$unwind': {
              'path': '$reviews'
            }
          }, {
            '$lookup': {
              'from': 'users', 
              'localField': 'reviews.user', 
              'foreignField': '_id', 
              'as': 'user'
            }
          }, {
            '$unwind': {
              'path': '$user'
            }
          }, {
            '$project': {
              'user.name': 1, 
              'reviews': 1
            }
          }
        ]) 
        resolve(reviews)
      }catch(error){
        reject(error)
      }
    })
  }

}
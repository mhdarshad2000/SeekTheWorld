var express = require('express');
var router = express.Router();
var User = require('../models/user')
var Package = require('../models/package')

const nodemailer = require('../config/connections')
const packageHelpers = require('../helpers/packageHelpers')
const userHelpers = require('../helpers/userHelpers');
const categoryHelpers = require('../helpers/categoryHelpers')
const multer = require('../middleware/multer')
const bookingHelpers = require('../helpers/bookingHelpers')
const couponHelpers = require('../helpers/couponHelpers')
const dashboardHelpers = require('../helpers/dashboardHelpers')
/* GET users listing. */


// async function run(){
//     const admin = new User({email:"seektheworld@12.com",password:"$2b$10$fcWfJuuwZCYpnlKIonEFIuoSPnB74rCXn4L/1FFMcLqv3pQF6M65m",role:true})
//     await admin.save()
//     console.log(admin)
// }  
// run()

const verifyAdminLogin = (req,res,next)=>{
  if(req.session.adminloggedIn){
    next()
  }else{
res.redirect('/admin')
  }
}

router.get('/', function(req, res) {
  if(req.session.adminloggedIn){
    res.redirect('/admin/dashboard')
  }else{
  let emailErr=req.session.emailErr
  let passErr=req.session.passErr
  res.render('admin/admin-login',{layout:"layout",emailErr,passErr});
  req.session.emailErr=false
  req.session.passErr=false
  }
}); 

router.get('/logout',(req,res)=>{
  req.session.adminloggedIn=false
  res.redirect('/admin')
})

// add product
router.get('/dashboard',verifyAdminLogin,async(req,res,next)=>{
  try{
     const countUsers = await dashboardHelpers.countUsers()
     const bookingCount = await dashboardHelpers.countBookings()
     const packages = await dashboardHelpers.packages()
     const totalRevenue = await dashboardHelpers.totalRevenue()
     const todaySale = await dashboardHelpers.todaySale()
     const totalCancels = await dashboardHelpers.totalCancels()
     const todayCancels = await dashboardHelpers.todayCancels()
     const paymentPie = await dashboardHelpers.paymentPie()
     const categoryWise = await dashboardHelpers.categoryPrice()
     const dailyRevenue = await dashboardHelpers.dailyRevenue()
     const dailyRefund = await dashboardHelpers.dailyRefund()
  const totalBookingLength = bookingCount.length
    const bookings = {bookingCount,totalBookingLength}
     res.render('admin/admin-dashboard',{layout:"layout",
     admin:true,
     countUsers,
     bookings,
     packages,
     totalRevenue,
     todaySale,
     totalCancels,
     todayCancels,
     paymentPie,
     categoryWise,
     dailyRevenue,
     dailyRefund
    }) 
  }catch(error){
    next(error)
  }
    
})


router.post('/login',async(req,res,next)=>{
  try{
  const response = await userHelpers.doLogin(req.body)
    if(response.status){
      req.session.adminloggedIn=true;
      res.redirect('/admin/dashboard')
    }else{
      if(response.passErr){
        req.session.passErr=true
        res.redirect('/admin')
      }else{
          req.session.emailErr=true
          res.redirect('/admin')
      }
    }
    }catch(error){
      next(error)
    }
})

router.get('/category',verifyAdminLogin,async(req,res,next)=>{
  try{
    const category = await categoryHelpers.getCategory()
      res.render('admin/category',{layout:"layout",admin:true,category})
}catch(error){
  next(error)
}
})
router.get('/category/add',verifyAdminLogin,(req,res)=>{
    res.render('admin/addCategory',{layout:"layout",admin:true})
})
router.post('/category_add',verifyAdminLogin,async(req,res,next)=>{
  try{
  const category = await categoryHelpers.addCategory(req.body)
    if(category.exist){
      res.json({exist:true})
    }else{
      res.json({inserted:true})
    }
  }catch(error){
    next(error)
  }
})

router.get('/delete-category/:id',verifyAdminLogin,(req,res)=>{
  categoryHelpers.deleteCategory(req.params.id)
  res.json({status:true})
})
router.post('/category/edit/:id',verifyAdminLogin,async(req,res,next)=>{
  try{
  const editCategory = await categoryHelpers.editCategory(req.params.id,req.body)
  res.redirect('/admin/category')
  }catch(error){
    next(error)
  }
})

router.get('/deleted-categories',verifyAdminLogin,(req,res)=>{
    categoryHelpers.deletedCategories().then((response)=>{
      res.render('admin/del-category',{layout:"layout",response,admin:true})
    }).catch((err)=>{
      alert(err)
    })
})
router.get('/restore-category/:id',verifyAdminLogin,(req,res)=>{
  categoryHelpers.restoreCategory(req.params.id)
  res.redirect('/admin/deleted-categories')
})
router.get('/users',verifyAdminLogin,(req,res)=>{
    userHelpers.getUsers().then((users)=>{
        res.render('admin/show-user',{layout:"layout",admin:true,users})
    }).catch((err)=>{
      alert(err)
    })
})

router.get('/block-user/:id',verifyAdminLogin,(req,res)=>{
    userHelpers.blockUser(req.params.id).then((response)=>{
      req.session.userloggedIn = false
      res.json({response:true})
    })
})
router.get('/unblock-user/:id',verifyAdminLogin,(req,res)=>{
   userHelpers.unblockUser(req.params.id).then((response)=>{
    res.json({response:true})
   })
})

router.get('/package',verifyAdminLogin,(req,res)=>{
    packageHelpers.getPackages().then((response)=>{
      if(req.session.packageUpdate){
      const update =true
      res.render('admin/package',{layout:"layout",admin:true,response,update})
      req.session.packageUpdate=false
      }
      res.render('admin/package',{layout:"layout",admin:true,response})
    }).catch((error)=>{
      alert(error)
    })
})

router.get('/add-package',verifyAdminLogin,(req,res)=>{
    categoryHelpers.getCategory().then((category)=>{
      res.render('admin/add-package',{layout:"layout",category,admin:true})
    }).catch((error)=>{
      alert(error)
    })
})
router.post('/add-package',verifyAdminLogin, store.array('Image',12),(req,res)=>{
  let img = []
  if(req.files.length>0){
    img = req.files.map(file=>{
      return file.filename
    })
  }
  packageHelpers.addPackage(req.body,img).then((result)=>{
    res.redirect('/admin/add-package')
  }).catch((err)=>{
    console.log('error'+err);
  })
})
router.get('/edit-package/:id',verifyAdminLogin,async(req,res,next)=>{
  try{
  const package = req.params.id
  const editElem = await packageHelpers.fetchPackage(package)
  const cat = await categoryHelpers.getCategory()
  res.render('admin/edit-package',{layout:"layout",editElem,cat,admin:true})
  }catch(error){
    next(error)
  }
})

router.post('/package/edit/:id',verifyAdminLogin,store.array('Image',12),async(req,res,next)=>{
  const package = req.params.id
  let img = []
  if(req.files.length>0){
    img = req.files.map(file=>{
      return file.filename
    })
  }
  try{
  const editPackage = await packageHelpers.editPackage(package,req.body,img)
  res.redirect('/admin/package')
  }catch(error){
    next(error)
  }
})



router.get('/delete-package/:id',verifyAdminLogin,(req,res)=>{
  packageHelpers.deletePackage(req.params.id).then(()=>{
    res.redirect('/admin/package')
  }).catch((error)=>{
    alert(error)
  })
})

router.get('/banner',verifyAdminLogin,(req,res)=>{
    res.render('admin/banner')
})
router.post('/banner',verifyAdminLogin,store.array('Image',1),async(req,res,next)=>{
  try{
  let img = []
  if(req.files.length>0){
    img = req.files.map(file=>{
      return file.filename
    })
  }
  userHelpers.addBanner(req.body,img)
  res.redirect('/admin/dashboard')
  }catch(error){
    next(error)
  }
})
router.get('/bookings',verifyAdminLogin,async(req,res,next)=>{
  try{
      const bookings = await bookingHelpers.getBookings()
      res.render('admin/bookings',{admin:true,layout:"layout",bookings})
  }catch(error){
    next(error)
  }
})
router.get('/bookings/cancels',verifyAdminLogin,async(req,res,next)=>{
  try{
      const cancels = await bookingHelpers.getCancels()
      res.render('admin/cancels',{admin:true,layout:"layout",cancels})
  }catch(error){
    next(error)
  }
})
router.get('/bookings/completed',verifyAdminLogin,async(req,res,next)=>{
  try{
    const completed = await bookingHelpers.getCompleted()
    res.render('admin/completed',{admin:true,layout:"layout",completed})
  }catch(error){
    next(error)
  }
})
router.get('/bookings/active',verifyAdminLogin,async(req,res,next)=>{
  try{
    const active = await bookingHelpers.getActive()
    res.render('admin/active',{admin:true,layout:"layout",active})
  }catch(error){
    next(error)
  }
})
router.get('/coupons',verifyAdminLogin,async(req,res,next)=>{
  try{
      const coupon = await couponHelpers.adminCouponView()
      res.render('admin/coupon',{admin:true,layout:"layout",coupon})
  }catch(error){
    next(error)
  }
  
})
router.get('/coupons/add',verifyAdminLogin,(req,res)=>{
    exist=false
    if(req.session.couponExist){
    var exist=req.session.couponExist
    }
    res.render('admin/couponAdd',{admin:true,layout:"layout",exist})
    req.session.couponExist=false
})
router.post('/coupon/add',verifyAdminLogin,store.array('Image',1),async(req,res,next)=>{
  try{
  const addCoupon = await couponHelpers.addCoupon(req.body,req.files)
  if(addCoupon.exist){
    req.session.couponExist=true
  }
  res.redirect('/admin/coupons/add')
  }catch(error){
    next(error)
  }
})
router.get('/coupon/update/:id',verifyAdminLogin,async(req,res,next)=>{
  try{
    const coupon = req.params.id
    const couponData = await couponHelpers.fetchCoupon(coupon)
    
    res.render('admin/updateCoupon',{admin:true,layout:"layout",couponData})
  }catch(error){
    next(error)
  }

})
router.post('/coupon/update/:id',verifyAdminLogin,store.array('Image',1),async(req,res,next)=>{

  try{
    const updateCoupon = await couponHelpers.updateCoupon(req.params.id,req.body,req.files)
    if(updateCoupon.exist){
      req.session.couponExist=true
    }
    res.redirect('/admin/coupons')
  }catch(error){
    next(error)
  }

})
router.get('/coupon/delete/:id',verifyAdminLogin,async(req,res,next)=>{
  const deleteCoupon = await couponHelpers.deleteCoupon(req.params.id)
  res.json({status:true})
})

router.get('/socket',(req,res)=>{
  res.render('admin/socket')
})
module.exports = router; 

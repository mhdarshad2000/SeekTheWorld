var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/userHelpers')
const twilioHelpers = require('../helpers/twilioHelpers')
const packageHelpers = require('../helpers/packageHelpers')
const categoryHelpers = require('../helpers/categoryHelpers')
const calculationHelpers = require('../helpers/calculationHelpers')
const bookingHelpers = require('../helpers/bookingHelpers')
const couponHelpers = require('../helpers/couponHelpers')
const dashboardHelpers = require('../helpers/dashboardHelpers')
const {isBlocked} = require('../middleware/isBlocked')
const multer = require('../middleware/multer')
const nodemailer = require('../config/nodemailer');
const { countBookings } = require('../helpers/dashboardHelpers');
/* GET home page. */


// router.use(isBlocked())
let filteredPackages =false


let login =false

const checkBlocked=async(req,res,next)=>{
  if(req.session.userloggedIn){
    const user = req.session.userProfile._id
    try{
      const userBlocked = await userHelpers.isBlocked(user)
      if(userBlocked.blocked){
        req.session.userloggedIn = false
        res.redirect('/login')
      }else{
        next()
      }
    }catch(error){
      next(error)
    }
  }else{
    next()
  }
}
const verifyLogin=(req,res,next)=>{
  if(req.session.userloggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

router.get('/',checkBlocked,async(req,res,next)=>{
  try{
    const banner = await userHelpers.getBanner()
    const cat = await categoryHelpers.getCategory()
    const newPackages = await packageHelpers.newPackages()
  if(req.session.userloggedIn){
      res.render('user/user',{login:true,user:true,layout:"User-layout",banner,cat,newPackages})
  }else{
      res.render('user/user',{user:true,layout:"User-layout",banner,cat,newPackages})
  }
  }catch(error){
    next(error)
  }
})

router.get('/login', function(req,res) {
  if(req.session.userloggedIn){
    res.redirect('/')
  }else{
  let emailErr=req.session.emailErr
  let passErr=req.session.passErr
  res.render('user/user-login',{emailErr,passErr});
  req.session.emailErr=false
  req.session.passErr=false
  }
});

router.post('/ulogin',async(req,res,next)=>{
  try{
  await userHelpers.doUserLogin(req.body).then((response)=>{
    
    if(response.status){
      req.session.userloggedIn=true;
      req.session.userProfile=response.user
      if(req.session.bookingData){
        req.session.booking=true
        res.redirect('/booking')
      }else{
      res.redirect('/')
      }
    }else{
      if(response.passErr){
        req.session.passErr=true
        res.redirect('/login')
      }else{
        if(response.emailErr){
          req.session.emailErr=true
          res.redirect('/login')
          }
    }
  }
  })
}catch(error){
  next(error)
} 
})
router.get('/forgetPassword',(req,res)=>{
  const noUser = req.session.noUser
  res.render('user/forget',{noUser})
  req.session.noUser=false     
})

router.get('/forgetOtp',(req,res)=>{
  if(req.session.forgetOtp){
    const phone = req.session.forgetInfo
    res.render('user/forgetOtp',{phone})
  }else{
    res.redirect('/forgetPassword')
  }
})

router.post('/forgetPassword',checkBlocked,async(req,res,next)=>{
  try{
    req.session.forgetInfo=req.body
    const user = await userHelpers.forgetPassword(req.body)
  if(user.userNotExist){
    req.session.noUser=true
    res.redirect('/forgetPassword')
  }else{
    const data= await twilioHelpers.doSms(req.session.forgetInfo)
    if(data){
    req.session.forgetOtp=true
    res.redirect('/forgetOtp')
    }
    // const userUpdate = await userHelpers.updatePassword(phone,password)
  }
  }catch(error){
    next(error)
  }
})
router.post('/forgetOtpverify',async(req,res,next)=>{
  try{
    const status = {}
    const verify = await twilioHelpers.otpVerify(req.body,req.session.forgetInfo)
    
    if(verify.valid){
      const update= await userHelpers.updatePassword(req.session.forgetInfo)
      if(update){
        status.passwordUpdated=true
        res.redirect('/login')
      }
    }else{
      status.otpError=true
res.redirect('/forgetOtp')
    }
  }catch(error){
    next(error)
  }
})


router.get('/logout',(req,res)=>{
  req.session.userloggedIn=false
  res.redirect('/')
})

router.get('/signup',(req,res)=>{
  if(req.session.userloggedIn){
    res.redirect('/')
  }else{
  let exist=req.session.exist
  res.render('user/user-signup',{exist})
  req.session.exist=false
  }
})
router.get('/otp',(req,res)=>{
  if(req.session.otp){
    const phone = req.session.otpbody.phone
    res.render('user/otp',{phone})
  }else{
    res.redirect('/signup')
  }
})

router.post('/signup',async(req,res,next)=>{
  try{
  req.session.otpbody=req.body
   const response = await userHelpers.doUnique(req.body)
    if(response.exist){
      req.session.exist=true
      res.redirect('/signup')
    }else{
      const data = await twilioHelpers.doSms(req.session.otpbody)
        req.session.otp=true
        if(data){
          res.redirect('/otp')
        }else{
          res.redirect('/signup')
        }
    }
}catch(error){
  next(error)
}
})

router.get('/resendOtp',async(req,res,next)=>{
  try{
    await twilioHelpers.doSms(req.session.otpbody).then((data)=>{
      if(data){
        res.redirect('/otp')
      }
    })
  }catch(error){
    next(error)
  }
})
router.post('/otpverify',async(req,res,next)=>{
  try{
  const response = await twilioHelpers.otpVerify(req.body,req.session.otpbody)
    if(response.valid){
    await userHelpers.doSignup(req.session.otpbody).then((signup)=>{
      if(signup){
      req.session.otp=false
      res.redirect('/login')
      }
    })       
  }
    res.redirect('/otp')

}catch(error){
  next(error)
}
})


router.get('/package',checkBlocked,async(req,res,next)=>{
  try{
  if(req.session.userloggedIn){
    const user = req.session.userProfile._id
    var package = await packageHelpers.getPackages(user)
    login =true
  }else{
    login = false
  var package = await packageHelpers.getPackages()
  }
  if(package){
    filteredPackages=package
    res.redirect('/viewPackages')
  }
}catch(error){
  next(error)
}
})
router.get('/viewPackages',checkBlocked,async(req,res,next)=>{
  try{
  const category = await categoryHelpers.getCategory()
  res.render('user/package',{login,user:true,layout:"User-layout",filteredPackages,category})
  }catch(error){
    next(error)
  }
})

router.get('/fetchpackage/:id',checkBlocked,async(req,res,next)=>{
  try{
    if(req.session.userloggedIn){
      const user = req.session.userProfile._id
      var packageInfo=await packageHelpers.fetchPackage(req.params.id)
      login = true
    }else{
      login = false
      var packageInfo=await packageHelpers.fetchPackage(req.params.id)
    }  
  const relatedPackage = await packageHelpers.relatedPackage(packageInfo[0].category)
  res.render('user/eachPackage',{login,packageInfo,layout:"User-layout",user:true,relatedPackage})
  }catch(error){
    next(error)
  }
})

router.post('/filter',checkBlocked,async(req,res,next)=>{
  try{
    if(req.session.userloggedIn){
      const user = req.session.userProfile._id
      filteredPackages = await packageHelpers.filterPackage(req.body,user)
      res.json({status:true})
    }else{
    filteredPackages = await packageHelpers.filterPackage(req.body)
    res.json({status:true})
    }
    if(req.body.priceSort=='sort'){
      res.json({status:true})
    }if(req.body.priceSort=='low'){
      filteredPackages.sort((a,b)=>a.price.adult - b.price.adult)
      res.json({status:true})
    }if(req.body.priceSort=='high'){
      filteredPackages.sort((a,b)=>b.price.adult - a.price.adult )
      res.json({status:true})
    }
  }catch(error){
    next(error)
  }
})


router.get('/booking',checkBlocked,verifyLogin,async(req,res,next)=>{
  try{
  if(req.session.booking){
    
    if(req.session.coupon){
      var couponDiscount = req.session.coupon.offer
      var couponName = req.session.coupon
    }else{
      var couponDiscount = 0
    }
    const user = req.session.userProfile
    const packageId = req.session.bookingData.package
    const packageDetails = await packageHelpers.getPack(packageId)
    const bookingPrice = req.session.bookingData
    var amount = await calculationHelpers.totalAmount(packageDetails,bookingPrice,couponDiscount)
    const form = req.session.bookingData
    const coupon = await couponHelpers.getCoupon()
  res.render('user/booking',{user:true,layout:"User-layout",login:true,amount,form,user,packageDetails,coupon,couponName})
  }else{
    res.redirect('/')
  } 
  }catch(error){
    next(error)
  }
})
router.post('/booking',checkBlocked,(req,res)=>{
  req.session.bookingData=req.body
  if(req.session.userloggedIn == false){
    res.redirect('/login')
  }else{
    req.session.booking=true
    res.redirect('/booking')
  }
})
router.get('/success',(req,res)=>{
    res.render('user/success',{layout:"User-layout"})

})
router.post('/payment',verifyLogin,checkBlocked,async(req,res,next)=>{
  try{
    const user = req.session.userProfile._id
    const {totalPrice,coupon,package} = req.body
    const bookingDetails = req.session.bookingData
    const booking = await bookingHelpers.doBooking(user,totalPrice,bookingDetails)
    const orderId = await bookingHelpers.recentId(user)
    const recent = orderId.slice(-1)
    const id=recent[0].orderId
    const Price = Number(recent[0].totalPrice) 
    bookingHelpers.generateRazorPay(id,Price).then((response)=>{  
      res.json(response)
    })
  
  }catch(error){
    next(error)
  }
})

router.post('/verifyPayment',verifyLogin,checkBlocked,async(req,res,next)=>{
  try{
  bookingHelpers.verifyPayment(req.body).then(()=>{
    bookingHelpers.changePaymentStatus(req.body['order[receipt]'],req.body['payment[razorpay_payment_id]']).then(async()=>{
      const mail = req.session.userProfile.email
      const subject = 'Booking Has Been Confirmed'
      const order = await bookingHelpers.getBooking(req.session.userProfile._id,req.body['order[receipt]'])
      const book = order[0]
      console.log(book)
      const text = 'Your Payment of' +' ' +book.totalPrice +' '+ 'Against booking of' +' '+   book.packagename + ' '+
      'has been recieved. And Your travel has been shceduled to the date' + ' ' + book.boarding+ '\n Seek The World'
      const doEmail = await nodemailer.doEmail(mail,subject,text)
      if(req.session.coupon){
        const user = req.session.userProfile._id
        const couponId = req.session.coupon._id
        const couponStatusChange = await couponHelpers.changeCouponStatus(user,couponId)
      }
      req.session.coupon = false
      req.session.booking=false
      res.json({status:true})
    })
  })
}catch(error){
    console.log(error)
    res.json({status:false,errMsg:""})
  }
})
router.get('/myBookings',verifyLogin,checkBlocked,async(req,res,next)=>{
try{
  const user = req.session.userProfile._id
  const bookings = await Promise.all([
  bookingHelpers.myBookings(user),
  bookingHelpers.cancelledBookings(user),
  bookingHelpers.activeBookings(user),
  bookingHelpers.completedBookings(user)
])
  res.render('user/myBookings',{layout:"User-layout",
  user:true,
  login:true,
  upcoming:bookings[0],
  cancelled:bookings[1],
  active:bookings[2],
  completed:bookings[3],
  user})
}catch(error){
  next(error)
} 
})
router.get('/booking/cancel/:id',verifyLogin,checkBlocked,async(req,res,next)=>{
  try{
    const order = req.params.id
    const orderDetails = await bookingHelpers.getTheOrder(order)
    const initiateRefund = await bookingHelpers.refundCheck(orderDetails)
    const cancel = await bookingHelpers.cancelBooking(order,initiateRefund)
    const mail = req.session.userProfile.email
      const subject = 'Booking Has Been Cancelled'
      const book = orderDetails[0]
      console.log(book)
      const text = 'Your Cancellation of' +' ' +book.package.name +' '+ 'Is successful And the amount of'+' ' + book.booking.totalPrice+ ' ' +'will be credited to your account.\n Seek The World'
      const doEmail = await nodemailer.doEmail(mail,subject,text)
    res.redirect('/myBookings')
  }catch(error){
    next(error)
  }
})

  router.get('/addToWishlist/:id',verifyLogin,checkBlocked,async(req,res,next)=>{
    try{
      const packageId = req.params.id
    const user = req.session.userProfile._id
   bookingHelpers.addToWishlist(packageId,user).then(()=>{
    res.json({status:true})
   })
  }catch(error){
    next(error)
  }
  })
  router.get('/removeFromWishlist/:id',verifyLogin,checkBlocked,async(req,res,next)=>{
    try{
      const packageId = req.params.id
    const user = req.session.userProfile._id
   bookingHelpers.removeFromWishlist(packageId,user).then((response)=>{
    res.json({status:true})
   })
  }catch(error){
    next(error)
  }

  })

  router.get('/myWishlists',verifyLogin,checkBlocked,async(req,res,next)=>{
    try{
      const user = req.session.userProfile._id
      let package = await packageHelpers.getPackages(user)
      res.render('user/wishlists',{layout:"User-layout",user:true,login:true,package})
    }catch(error){
      next(error)
    }
  })

  router.get('/profile',verifyLogin,checkBlocked,async(req,res,next)=>{
    try{
      const user = req.session.userProfile._id
      const profile = await userHelpers.userDetails(user)
      res.render('user/profile',{layout:"User-layout",user:true,login:true,profile})

  }catch(error){
    next(error)
  }
  })
  router.post('/updateUser',verifyLogin,checkBlocked,async(req,res,next)=>{
    const user = req.session.userProfile._id
    const {purpose} = req.body
    if(purpose=='userName'){
      const {purpose,fullname}=req.body
      try{
      await userHelpers.updateUser(user,purpose,fullname).then(()=>{
        res.json({submit:true})
      })
      
    }catch(error){
      next(error)
    }
  }else if(purpose == 'email'){
    const {purpose,email}=req.body
    try{
      await userHelpers.updateUser(user,purpose,email).then(()=>{
        res.json({emailUpdate:true})
      })
    }catch(error){
      next(error)
    }
  }else if(purpose == 'passport'){
    const {purpose,passport}=req.body
    try{
      await userHelpers.updateUser(user,purpose,passport).then(()=>{
        res.json({passportUpdate:true})
      })
    }catch(error){
      next(error)
    }
  }else if(purpose == 'phone'){
    re.session.updatePhone=req.body
    
    const {purpose,phone}=req.body
    try{
      await userHelpers.updatePhone(req.body).then(()=>{

      })
      await userHelpers.updateUser(user,purpose,phone).then(()=>{
        res.json({phoneUpdate:true})
      })
    }catch(error){
      next(error)
    }
  }
})
router.post('/updateAddress',verifyLogin,checkBlocked,async(req,res,next)=>{
  const user = req.session.userProfile._id
  try{
    await userHelpers.updateAddress(req.body,user).then(()=>{
      res.json({status:true})
    })
  }catch(error){
    next(error)
  }
})
router.post('/updateProfileImg',verifyLogin,checkBlocked,store.array('Image',1),async(req,res,next)=>{
  const user = req.session.userProfile._id
  let img = []
  if(req.files.length>0){
    img = req.files.map(file=>{
      return file.filename
    })
  }
  try{
const updateImg = await userHelpers.updateProfileImg(user,img)

  res.redirect('/profile')

  }catch(error){
    next(error)
  }
})

router.post('/applyCoupon',verifyLogin,checkBlocked,async(req,res,next)=>{
  try{
  const userId=req.session.userProfile._id
  const coupon = await couponHelpers.useCoupon(userId,req.body.id)
  if(coupon.used){
    res.json({used:true})
  }else{
    req.session.coupon = coupon
    res.json({coupon:true})
  }
}catch(error){
  next(error)
}
})
router.get('/removeCoupon',verifyLogin,checkBlocked,(req,res)=>{
  req.session.coupon = false
  res.json({remove:true})
})
router.post('/package/search',async(req,res,next)=>{
  let searchByText = req.body.searchKey
  try{
    const getPackageSearch= await packageHelpers.getPackages()
    if(searchByText){
      filteredPackages = getPackageSearch.filter((p)=>p.name.includes(searchByText))
      res.redirect('/viewPackages')
    }
  }catch(error){
    next(error)
  }
})
router.get('/aboutUs',checkBlocked,async(req,res,next)=>{
  try{
  if(req.session.adminloggedIn){
    login = true
  }
  let about = await Promise.all([
  dashboardHelpers.packages(),
 dashboardHelpers.countUsers()])
 console.log(about[0])
  res.render('user/about',{layout:"User-layout",user:true,login,packages:about[0],users:about[1]})
  }catch(error){
    next(error)
  }
})
router.get('/booking/view/:id',verifyLogin,checkBlocked,async(req,res,next)=>{
  try{
    console.log(req.params.id)
    const viewBooking = await bookingHelpers.getTheOrder(req.params.id)
    console.log(viewBooking)
    res.render('user/invoice',{layout:"User-layout",user:true,login:true,viewBooking})
  }catch(error){
    next(error)
  }
})
module.exports = router;

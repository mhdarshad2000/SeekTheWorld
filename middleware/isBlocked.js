// const userHelpers = require('../helpers/userHelpers')

// async function isBlocked(req,res,next){
//     if(req.session.userloggedIn){
//       const user = req.session.userProfile._id
//       const notBlocked = await userHelpers.notBlocked(user)
//       if(notBlocked){
//         next();
//       }
//       else{
//         req.session.userloggedIn = false
//         res.redirect('/login')
//       }
//     }
//     next();
  
//   }

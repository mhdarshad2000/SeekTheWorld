const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/seektheworld",{
    useNewUrlParser:true
}).then(()=>{
    console.log("Connection Successful");
}).catch((e)=>{
    console.log("No Connction");
})
require('dotenv').config()

const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const serviceSid= process.env.TWILIO_SERVICE_SID
module.exports={
    doSms:(noData)=>{
        let resp = {}
        return new Promise(async(resolve,reject)=>{
            await client.verify.services(serviceSid).verifications.create({
                to : `+91${noData.phone}`,
                channel:"sms"
            }).then((res)=>{
                resp.valid=true
                console.log(res)
                resolve(res)      
            })   
        })
    },
    otpVerify:(otpData,nuData)=>{
        
        return new Promise(async(resolve,reject)=>{
            await client.verify.services(serviceSid).verificationChecks.create({
                to: `+91${nuData.phone}`,
                code: otpData.otp
            }).then((resp)=>{
                resolve(resp)
            })
            
        })
    },

}
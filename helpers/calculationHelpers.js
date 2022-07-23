module.exports = {
    totalAmount :(price,user,coupon)=>{
console.log(user)
        let response={}
        return new Promise((resolve,reject)=>{
            try{
            const adultTotal = parseInt( price.price.adult * user.adultCount)
            const childTotal = parseInt( price.price.child * user.childCount)
            const subTotal = parseInt(adultTotal+childTotal)
            const discount = parseInt((subTotal*Number(coupon))/100)
            const discountedPrice = parseInt(subTotal - discount)
            const tax = parseInt((discountedPrice*18)/100)
            const totalPrice = parseInt(discountedPrice+tax)
            response.adultTotal = adultTotal
            response.subTotal = subTotal
            response.childTotal = childTotal
            response.discount=discount
            response.tax = tax
            response.totalPrice = totalPrice
            resolve(response)
            }catch(error){
                reject(error)
            }
        })
    }
}
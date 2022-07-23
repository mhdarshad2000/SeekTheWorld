const User = require('../models/user')
const Package = require('../models/package')
const Mongoose = require('mongoose')
const Razorpay = require('razorpay')
const moment = require('moment')
require('dotenv').config()

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
module.exports = {
    doBooking: (user, totalPrice, booking) => {
        const userId = Mongoose.Types.ObjectId(user)
        const package = Mongoose.Types.ObjectId(booking.package)
        console.log(package)
        return new Promise(async (resolve, reject,) => {
            try{
            const date = moment(new Date).format("YYYY-MM-DD")
            const packages = await Package.findOne({ _id: package, isDeleted: false })
            const bookings = await User.updateOne({ role: false, _id: userId }, {
                $push: {
                    booking: {
                        adultsCount: booking.adultCount,
                        childsCount: booking.childCount,
                        boardingDate: booking.date,
                        returnDate: booking.destdate,
                        totalPrice: totalPrice,
                        paymentStatus: "pending",
                        status: "upcoming",
                        package: packages,
                        bookingDate: date
                    }
                }

            })
            resolve(bookings)
        }catch(error){
            reject(error)
        }
        })
    },
    recentId: (user) => {
        const userId = Mongoose.Types.ObjectId(user)
        return new Promise(async (resolve, reject) => {
            try{
            const bookings = await User.aggregate(
                [
                    {
                        '$match': {
                            '_id': userId
                        }
                    }, {
                        '$project': {
                            'booking': 1,
                            '_id': 0
                        }
                    }, {
                        '$unwind': {
                            'path': '$booking'
                        }
                    },
                    {
                        '$project': {
                            'totalPrice': '$booking.totalPrice',
                            'orderId': '$booking._id'
                        }
                    }
                ]
            )
            resolve(bookings)
            }catch{
                reject(error)
            }
        })
    },
    generateRazorPay: (orderId, amount) => {

        return new Promise((resolve, reject) => {

            const options = {
                amount: amount * 100,
                currency: 'INR',

                receipt: `${orderId}`,
            };
            instance.orders.create(options, (err, order) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("new order", order)
                    resolve(order);
                }
            });

        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId, paymentId) => {
        return new Promise(async (resolve, reject) => {
            try{
            const bookingId = Mongoose.Types.ObjectId(orderId)
            await User.updateOne({ 'booking._id': bookingId }, {
                $set: {
                    'booking.$.paymentStatus': "Paid",
                    'booking.$.paymentRef': paymentId,

                }
            })
            resolve()
            }catch(error){
                reject(error)
            }
        })
    },

    cancelBooking: (orderId, refundId) => {
        console.log(refundId)
        const date = moment(new Date).format("YYYY-MM-DD")
        const order = Mongoose.Types.ObjectId(orderId)
        return new Promise(async (resolve, reject) => {
            try {
                const cancel = await User.updateOne({ 'booking._id': order }, {
                    $set: {
                        'booking.$.status': "cancelled",
                        'booking.$.paymentStatus': "Refunded",
                        'booking.$.refundId': refundId.id,
                        'booking.$.cancelledDate': date
                    }
                })
                resolve(cancel)
            } catch (error) {
                reject(error)
            }
        })
    },
    myBookings: (userId) => {
        return new Promise(async (resolve, reject) => {
            try{
            const user = Mongoose.Types.ObjectId(userId)
            const upcoming = await User.aggregate([{
                $match: {
                    _id: user,
                    isBlocked: false
                }
            },
            { $unwind: '$booking' },
            {
                $lookup: {
                    from: 'packages',
                    localField: 'booking.package',
                    foreignField: '_id',
                    as: 'packages'
                }
            },
            { $unwind: '$packages' },
            {
                $match: {
                    'booking.status': "upcoming",
                    'booking.paymentStatus': "Paid",
                    'booking.boardingDate': { '$gte': new Date() }
                }
            }, {
                $project: {
                    'packages.name': 1,
                    boarding: { $dateToString: { format: "%Y-%m-%d", date: '$booking.boardingDate' } },
                    return: { $dateToString: { format: "%Y-%m-%d", date: '$booking.returnDate' } },
                    booking: {
                        totalPrice: 1,
                        status: 1,
                        _id: 1,
                        paymentRef: 1
                    }
                }
            }
            ])
            resolve(upcoming)
        }catch(error){
            reject(error)
        }
        })
    },
    activeBookings: (userId) => {
        return new Promise(async (resolve, reject) => {
            const user = Mongoose.Types.ObjectId(userId)
            try {
                const active = await User.aggregate([{
                    $match: {
                        _id: user,
                        isBlocked: false
                    }
                },
                { $unwind: '$booking' },
                {
                    $lookup: {
                        from: 'packages',
                        localField: 'booking.package',
                        foreignField: '_id',
                        as: 'packages'
                    }
                },
                { $unwind: '$packages' },
                {
                    $match: {
                        'booking.status': "upcoming",
                        'booking.boardingDate': { '$lte': new Date() },
                        'booking.returnDate': { '$gte': new Date() },
                        'booking.paymentStatus': "Paid"
                    }
                }, {
                    $project: {
                        'packages.name': 1,
                        boarding: { $dateToString: { format: "%Y-%m-%d", date: '$booking.boardingDate' } },
                        return: { $dateToString: { format: "%Y-%m-%d", date: '$booking.returnDate' } },
                        booking: {
                            totalPrice: 1,
                            status: 1,
                            _id: 1,
                            paymentRef: 1
                        }
                    }
                }
                ])
                resolve(active)
            } catch (error) {
                reject(error)
            }
        })
    },
    cancelledBookings: (userId) => {
        return new Promise(async (resolve, reject) => {
            try{
            const user = Mongoose.Types.ObjectId(userId)
            const cancelled = await User.aggregate([{
                $match: {
                    _id: user,
                    isBlocked: false
                }
            },
            { $unwind: '$booking' },
            {
                $lookup: {
                    from: 'packages',
                    localField: 'booking.package',
                    foreignField: '_id',
                    as: 'packages'
                }
            },
            { $unwind: '$packages' },
            {
                $match: {
                    'booking.status': "cancelled",
                }
            }, {
                $project: {
                    boarding: { $dateToString: { format: "%Y-%m-%d", date: '$booking.boardingDate' } },
                    return: { $dateToString: { format: "%Y-%m-%d", date: '$booking.returnDate' } },
                    'packages.name': 1,
                    booking: {
                        totalPrice: 1,
                        status: 1,
                        _id: 1
                    }

                }
            }
            ])
            resolve(cancelled)
        }catch(error){
            reject(error)
        }
        })
    },
    completedBookings: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = Mongoose.Types.ObjectId(userId)
                const completed = await User.aggregate([{
                    $match: {
                        _id: user,
                        isBlocked: false
                    }
                },
                { $unwind: '$booking' },
                {
                    $lookup: {
                        from: 'packages',
                        localField: 'booking.package',
                        foreignField: '_id',
                        as: 'packages'
                    }
                },
                { $unwind: '$packages' },
                {
                    $match: {
                        'booking.status': "upcoming",
                        'booking.returnDate': { $lt: new Date() },
                        'booking.paymentStatus': "Paid"
                    }
                }, {
                    $project: {
                        boarding: { $dateToString: { format: "%Y-%m-%d", date: '$booking.boardingDate' } },
                        return: { $dateToString: { format: "%Y-%m-%d", date: '$booking.returnDate' } },
                        'packages.name': 1,
                        booking: {
                            totalPrice: 1,
                            status: 1,
                            _id: 1
                        }

                    }
                }
                ])
                resolve(completed)
            } catch (error) {
                reject(error)
            }
        })
    },
    getBookings: () => {
        return new Promise(async (resolve, reject, next) => {
            try {
                const upcomingBookings = await User.aggregate([
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
                            'booking.status': 'upcoming',
                            'booking.paymentStatus': 'Paid',
                            'booking.boardingDate': { '$gte': new Date() }
                        }
                    }, {
                        '$lookup': {
                            'from': 'packages',
                            'localField': 'booking.package',
                            'foreignField': '_id',
                            'as': 'packages'
                        }
                    }, {
                        '$unwind': {
                            'path': '$packages'
                        }
                    }, {
                        '$lookup': {
                            'from': 'categories',
                            'localField': 'packages.category',
                            'foreignField': '_id',
                            'as': 'categories'
                        }
                    }, {
                        '$unwind': {
                            'path': '$categories'
                        }
                    }, {
                        '$project': {
                            'username': '$name',
                            'email': 1,
                            'phone': 1,
                            'boarding': {
                                '$dateToString': {
                                    'format': '%Y-%m-%d',
                                    'date': '$booking.boardingDate'
                                }
                            },
                            'return': {
                                '$dateToString': {
                                    'format': '%Y-%m-%d',
                                    'date': '$booking.returnDate'
                                }
                            },
                            'totalPrice': '$booking.totalPrice',
                            'packagename': '$packages.name',
                            'category': '$categories.categoryName',
                            'Adults': '$booking.adultsCount',
                            'childs': '$booking.childsCount',
                            'paymentStatus': '$booking.paymentStatus',
                            'paymentRef': '$booking.paymentRef'
                        }
                    }
                ])
                resolve(upcomingBookings)
            } catch (error) {
                next(error)
            }
        })
    },
    getCancels: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const cancelledBookings = await User.aggregate([
                    {
                        $match:
                            { role: false }
                    },
                    { $unwind: '$booking' },
                    {
                        $match: {
                            "booking.status": "cancelled",
                            "booking.paymentStatus": "Refunded"
                        }
                    },
                    {
                        $lookup: {
                            from: 'packages',
                            localField: 'booking.package',
                            foreignField: '_id',
                            as: 'packages'
                        }
                    }, {
                        $unwind: '$packages'
                    }, {
                        $lookup: {
                            from: 'categories',
                            localField: 'packages.category',
                            foreignField: '_id',
                            as: 'categories'
                        }
                    }, {
                        $unwind: '$categories'
                    }, {
                        $project: {
                            username: '$name',
                            email: 1,
                            phone: 1,
                            boarding: { $dateToString: { format: "%Y-%m-%d", date: '$booking.boardingDate' } },
                            return: { $dateToString: { format: "%Y-%m-%d", date: '$booking.returnDate' } },
                            totalPrice: '$booking.totalPrice',
                            packagename: '$packages.name',
                            category: '$categories.categoryName',
                            Adults: '$booking.adultsCount',
                            childs: '$booking.childsCount',
                            refundRef: '$booking.refundId'
                        }
                    }

                ])
                resolve(cancelledBookings)
            } catch (error) {
                reject(error)
            }
        })
    },
    getCompleted: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const completedBookings = await User.aggregate([
                    {
                        $match:
                            { role: false }
                    },
                    { $unwind: '$booking' },
                    {
                        $match: {
                            'booking.status': "upcoming",
                            'booking.returnDate': { $lt: new Date() },
                            'booking.paymentStatus': "Paid"
                        }
                    },
                    {
                        $lookup: {
                            from: 'packages',
                            localField: 'booking.package',
                            foreignField: '_id',
                            as: 'packages'
                        }
                    }, {
                        $unwind: '$packages'
                    }, {
                        $lookup: {
                            from: 'categories',
                            localField: 'packages.category',
                            foreignField: '_id',
                            as: 'categories'
                        }
                    }, {
                        $unwind: '$categories'
                    }, {
                        $project: {
                            username: '$name',
                            email: 1,
                            phone: 1,
                            boarding: { $dateToString: { format: "%Y-%m-%d", date: '$booking.boardingDate' } },
                            return: { $dateToString: { format: "%Y-%m-%d", date: '$booking.returnDate' } },
                            totalPrice: '$booking.totalPrice',
                            packagename: '$packages.name',
                            category: '$categories.categoryName',
                            Adults: '$booking.adultsCount',
                            childs: '$booking.childsCount',
                            paymentRef: '$booking.paymentRef'
                        }
                    }
                ])
                resolve(completedBookings)
            } catch (error) {
                reject(error)
            }
        })
    },
    getBooking: (userId, bookingId) => {
        return new Promise(async (resolve, reject) => {
            const user = Mongoose.Types.ObjectId(userId)
            const booking = Mongoose.Types.ObjectId(bookingId)
            try {
                const getBookingDetails = await User.aggregate([{
                    $match: { _id: user }
                }, {
                    $unwind: '$booking'
                }, {
                    $lookup: {
                        from: 'packages',
                        localField: 'booking.package',
                        foreignField: '_id',
                        as: 'package'
                    }
                },
                { $unwind: '$package' },
                {
                    $match: {
                        'booking._id': booking
                    }
                }, {
                    '$project': {
                        'username': '$name',
                        'email': 1,
                        'phone': 1,
                        'boarding': {
                            '$dateToString': {
                                'format': '%Y-%m-%d',
                                'date': '$booking.boardingDate'
                            }
                        },
                        'return': {
                            '$dateToString': {
                                'format': '%Y-%m-%d',
                                'date': '$booking.returnDate'
                            }
                        },
                        'totalPrice': '$booking.totalPrice',
                        'packagename': '$package.name',
                        'category': '$categories.categoryName',
                        'Adults': '$booking.adultsCount',
                        'childs': '$booking.childsCount',
                        'paymentStatus': '$booking.paymentStatus',
                        'paymentRef': '$booking.paymentRef'
                    }
                }
                ])
                resolve(getBookingDetails)
            } catch (error) {
                reject(error)
            }
        })
    },
    getActive: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const activeBookings = await User.aggregate([
                    {
                        $match:
                            { role: false }
                    },
                    { $unwind: '$booking' },
                    {
                        $match: {
                            'booking.status': "upcoming",
                            'booking.boardingDate': { '$lte': new Date() },
                            'booking.returnDate': { '$gte': new Date() },
                            'booking.paymentStatus': "Paid"
                        }
                    },
                    {
                        $lookup: {
                            from: 'packages',
                            localField: 'booking.package',
                            foreignField: '_id',
                            as: 'packages'
                        }
                    }, {
                        $unwind: '$packages'
                    }, {
                        $lookup: {
                            from: 'categories',
                            localField: 'packages.category',
                            foreignField: '_id',
                            as: 'categories'
                        }
                    }, {
                        $unwind: '$categories'
                    }, {
                        $project: {
                            username: '$name',
                            email: 1,
                            phone: 1,
                            boarding: { $dateToString: { format: "%Y-%m-%d", date: '$booking.boardingDate' } },
                            return: { $dateToString: { format: "%Y-%m-%d", date: '$booking.returnDate' } },
                            totalPrice: '$booking.totalPrice',
                            packagename: '$packages.name',
                            category: '$categories.categoryName',
                            Adults: '$booking.adultsCount',
                            childs: '$booking.childsCount',
                            paymentRef: '$booking.paymentRef'
                        }
                    }
                ])
                resolve(activeBookings)
            } catch (error) {
                reject(error)
            }
        })
    },
    addToWishlist: (packageId, userId) => {
        return new Promise(async (resolve, reject) => {
            try{
            const package = Mongoose.Types.ObjectId(packageId)
            const user = Mongoose.Types.ObjectId(userId)
            const isUser = await User.find({ _id: user, isBlocked: false })
            const update = await Package.updateOne({ _id: package }, { $addToSet: { wishlists: isUser } })
            resolve("updated")
            }catch(error){
                reject(error)
            }
        })

    },
    removeFromWishlist: (packageId, userId) => {
        return new Promise(async (resolve, reject) => {
            try{
            const package = Mongoose.Types.ObjectId(packageId)
            const user = Mongoose.Types.ObjectId(userId)
            const update = await Package.updateOne({ _id: package }, { $pull: { wishlists: user } })
            resolve(update)
            }catch(error){
                reject(error)
                }
        })
    },
    getTheOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const order = Mongoose.Types.ObjectId(orderId)
                const orderDetails = await User.aggregate([
                    {
                        $unwind: '$booking'
                    }, {
                        $lookup: {
                            from: 'packages',
                            localField: 'booking.package',
                            foreignField: '_id',
                            as: 'package'
                        }
                    }, {
                        $unwind: '$package'
                    },
                    {
                        $match: {
                            'booking._id': order
                        }
                    }
                ])
                resolve(orderDetails)
            } catch (error) {
                reject(error)
            }
        })
    },
    refundCheck: (orderDetails) => {
        return new Promise((resolve, reject) => {
            const refundAmount = orderDetails[0].booking.totalPrice
            const paymentRef = orderDetails[0].booking.paymentRef

            try {
                options = {
                    "amount": `${refundAmount}` * 100,
                    "speed": "optimum",
                }
                instance.payments.refund(`${paymentRef}`, options, (err, refund) => {
                    if (err) {
                        console.log(err)
                    } else {
                        resolve(refund)
                    }
                })

            } catch (error) {
                reject(error)
            }

        })

    }
}
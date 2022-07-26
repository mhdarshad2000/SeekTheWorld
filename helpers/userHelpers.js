var db = require('../config/connections')
const twilioHelpers = require('../helpers/twilioHelpers')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

module.exports = {
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let loginStatus = false
                let response = {}
                let admin = await User.findOne({ role: true, email: adminData.email })
                if (admin) {
                    bcrypt.compare(adminData.password, admin.password).then((status) => {
                        if (status) {
                            response.status = true;
                            resolve(response)
                        } else {
                            response.status = false;
                            response.passErr = true
                            resolve(response)
                        }

                    })
                } else {
                    response.status = false;
                    response.emailErr = true
                    resolve(response)
                }
            } catch (error) {
                reject(error)
            }

        })
    },
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                userData.password = await bcrypt.hash(userData.password, 10)
                User.create({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    password: userData.password,
                    role: false,
                    isBlocked: false,
                }).then((data) => {
                    data.insertedId = true
                    resolve(data.insertedId);
                })
            } catch (error) {
                reject(error)
            }
        })

    },
    doUserLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                let user = await User.findOne({ isBlocked: false, email: userData.email, role: false, })
                if (user) {
                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {
                            response.status = true;
                            response.user = user
                            resolve(response)
                        } else {
                            response.status = false;
                            response.passErr = true
                            resolve(response)
                        }

                    })
                } else {
                    response.status = false;
                    response.emailErr = true
                    resolve(response)
                }
            } catch (error) {
                next(error)
            }
        })

    },

    // forgetPassword: (user) => {
    //     const phone = user.phone
    //     const response = {}
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             const user = await User.findOne({ phone: phone })
    //             if (!user) {
    //                 response.userNotExist = true
    //                 resolve(response)
    //             }
    //             else {
    //                 resolve(response)
    //             }
    //         } catch (error) {
    //             reject(error)
    //         }
    //     })
    // },
    forgetPassword: (user) => {
        return new Promise(async (resolve, reject) => {
            try {
                const response = {}
                const email = user.email
                const exist = await User.findOne({ email: email, role: false, isBlocked: false })
                if (!user) {
                    response.userNotExist = true
                    resolve(response)
                }
                else {
                    resolve(exist)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    updatePassword: (email,updates) => {
        let updatePassword = updates.password
        return new Promise(async (resolve, reject) => {
            try {
                updatePassword = await bcrypt.hash(updatePassword, 10)
                const update = await User.updateOne({ email: email }, { $set: { password: updatePassword } })
                resolve(update)
            } catch (error) {
                reject(error)
            }
        })
    },

    getUsers: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let users = await User.aggregate([{
                    $match:
                    {
                        role: false
                    }
                },
                {
                    $project: {
                        role: 0,
                        __v: 0
                    }
                }])
                resolve(users)
            } catch (error) {
                reject(error)
            }
        })
    },
    blockUser: (user) => {
        let uid = mongoose.Types.ObjectId(user)
        return new Promise(async (resolve, reject) => {
            try {
                const block = await User.updateOne({ _id: uid }, {
                    $set: {
                        isBlocked: true
                    }
                })
                resolve(block)
            } catch (error) {
                reject(error)
            }
        })
    },
    unblockUser: (user) => {
        let unblockid = mongoose.Types.ObjectId(user)
        return new Promise(async (resolve, reject) => {
            try {
                const unBlocked = await User.updateOne({ _id: unblockid }, {
                    $set: {
                        isBlocked: false
                    }
                })
                resolve(unBlocked)
            } catch (error) {
                reject(error)
            }
        })

    },
    doUnique: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let valid = {}
                let email = await User.findOne({ email: userData.email })
                if (email) {
                    valid.exist = true
                    resolve(valid)
                }
                else {
                    resolve(valid)
                }
            } catch (error) {
                reject(error)
            }

        })
    },
    addBanner: (body, files) => {
        return new Promise(async (resolve, reject) => {
            await User.updateOne({ role: true }, {
                $set: {
                    "Banner.hero_title": body.Name,
                    "Banner.images": files,
                    "Banner.hero_button": body.hero_btn
                }
            })
        }).then(() => {
        })
    },
    getBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await User.aggregate([{ $match: { role: true } }, {
                $project: {
                    Banner: 1,
                    _id: 0
                }
            }])
            resolve(banner)
        })
    },
    userDetails: (user) => {
        const userId = mongoose.Types.ObjectId(user)
        return new Promise(async (resolve, reject) => {
            try {
                const profile = await User.aggregate([
                    {
                        $match:
                        {
                            _id: userId,
                            isBlocked: false
                        }
                    }
                ])
                resolve(profile[0])
            } catch (error) {
                reject(error)
            }
        })
    },
    isBlocked: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let status = {}
                const user = mongoose.Types.ObjectId(userId)
                const isBlocked = await User.findOne({ _id: user, isBlocked: true })
                if (isBlocked) {
                    status.blocked = true
                    resolve(status)
                } else {
                    status.blocked = false
                    resolve(status)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    notBlocked: (user) => {
        return new Promise(async (resolve, reject) => {
            try {
                const status = {}
                const userId = mongoose.Types.ObjectId(user)
                const userBlocked = await User.findOne({ _id: userId, isBlocked: false })
                if (userBlocked) {
                    status = true
                    resolve(status)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    updateUser: (userId, purpose, value) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = mongoose.Types.ObjectId(userId)
                if (purpose == 'userName') {
                    await User.updateOne(
                        { _id: user }, {
                        $set:
                        {
                            name: value
                        }
                    }).then(() => {
                        resolve()
                    })
                } else if (purpose == 'email') {
                    await User.updateOne(
                        { _id: user }, {
                        $set:
                        {
                            email: value
                        }
                    }).then(() => {
                        resolve()
                    })
                } else if (purpose == 'passport') {
                    await User.updateOne(
                        { _id: user }, {
                        $set:
                        {
                            passportNumber: value
                        }
                    }).then(() => {
                        resolve()
                    })
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    updateAddress: (address, userId) => {
        const user = mongoose.Types.ObjectId(userId)
        return new Promise(async (resolve, reject) => {
            try {
                await User.updateOne({ _id: user }, {
                    $set: {
                        'address.house': address.house,
                        'address.place': address.place,
                        'address.post': address.post,
                        'address.pinCode': address.pinCode,
                        'address.city': address.city,
                        'address.district': address.district,
                        'address.state': address.state
                    }
                })
                resolve()
            } catch (errro) {
                reject(error)
            }
        })
    },
    updatePhone: (phone) => {
        return new Promise(async (resolve, reject) => {
            await twilioHelpers.doSms(phone).then((data) => {
                if (data) {
                    res.render('user/phoneChangeOtp')
                }
            })
        })
    },
    updateProfileImg: (userId, profile) => {
        const user = mongoose.Types.ObjectId(userId)
        return new Promise(async (resolve, reject) => {
            try {
                await User.updateOne({ _id: user },
                    {
                        $set:
                        {
                            profileImage: profile
                        }
                    })
                resolve('success')
            } catch (error) {
                reject(error)
            }
        })
    }

}
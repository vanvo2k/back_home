const User = require('../models/User')


const createAffiliateCode = async () => {
    // random code with 8 characters and check if it exists in db
    let code = Math.random().toString(36).substring(2, 10).toUpperCase()
    const user = await User.findOne({affiliateCode: code}).lean()
    if (user) {
        code = createAffiliateCode()
    }
    return code
}
    
const main = async () => {
    // find each 50 active user and create affiliate code
    let isDone = false
    let skip = 0

    while (!isDone) {
        const users = await User.find({affiliateCode: {$exists: false}, status: 'active'}).skip(skip).limit(50).lean()
        console.log('users', users.length)
        if (!users.length) {
            isDone = true
            break
        }
        for (let i = 0; i < users.length; i++) {
            const user = users[i]
            const code = await createAffiliateCode()
            console.log('code', code)
            await User.update({_id: user._id}, {$set: {affiliateCode: code}})
            console.log('user', user._id, code)
        }
        skip += 50
    }
}
//     const users = await User.find({affiliateCode: {$exists: false}, status: 'active'}).lean()
//     console.log('users', users.length)
//     for (let i = 0; i < users.length; i++) {
//         const user = users[i]
//         const code = await createAffiliateCode()
//         console.log('code', code)
//         process.exit()
//         await User.update({_id: user._id}, {$set: {affiliateCode: code}})
//         console.log('user', user._id, code)
//     }
// }

main()

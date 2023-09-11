const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const _ = require('lodash');
const shortId = require('shortid');

const conn = require('../app.database');
const appConfig = require('../app.config');
const Membership = require('./Membership');
const {throwErrorWithCode} = require("../helpers/CommonHelpers");
const authHelpers = require('tamz-middleware/helpers/auth');

const {User} = require('tamz-schemas-database/schemas');

/**
 * Password hash middleware.
 */
User.pre('save', function (next) {
    const user = this;
    const password = user.get('password');

    if (!_.isEmpty(password)) {
        return next();
    }

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, null, (err, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

/**
 * Helper method for getting user's gravatar.
 */
User.methods.gravatar = function (size) {
    if (!size) {
        size = 200;
    }
    if (!this.email) {
        return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash('md5').update(this.email).digest('hex');

    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

/**
 * Generate access token.
 */
User.methods.generateToken = function () {
    const id = this.get('_id');
    const key = appConfig.get('/secretKey');
    const roles = this.get('roles');
    const status = this.get('status');

    if (status === 'blocked') {
        return throwErrorWithCode('Your account was locked.', 403);
    }

    return this.getScopes()
        .then(scopes => {
            const token = jwt.sign({id, scopes, roles}, key, {
                expiresIn: "30 days"
            });

            return Promise.resolve(token);
        });
};

/**
 * Get object profile
 */
User.methods.getProfile = function () {
    const id = this.get('_id');
    const email = this.get('email');
    const profile = this.get('profile');
    const avatar = this.gravatar();
    const settings = this.get('settings');
    const roles = this.get('roles');
    const meta = this.get('meta')
    const affiliateCode = this.get('affiliateCode')
    const phoneNumber = this.get('phoneNumber')
    const firstShowPromotionTime = this.get('firstShowPromotionTime')
    const _profile = Object.assign(profile, {
        id, email, avatar, meta, affiliateCode, phoneNumber, firstShowPromotionTime
    });

    return this.getScopes()
        .then(scopes => {
            const userData = Object.assign({}, {profile: _profile, scopes, settings, roles});

            return Promise.resolve(userData);
        })
        .then(profile => {//Get referral id
            return this.getReferralId()
                .then(referralId => {
                    const profile_ = Object.assign(profile, {referralId});

                    return Promise.resolve(profile_);
                });
        })
        .then(profile => {//Get affiliate code
            return this.getAffiliateCode()
                .then(affiliateCode => {
                    const profile_ = Object.assign(profile, {affiliateCode});

                    return Promise.resolve(profile_);
                });
        })
        .then(profile => {
            return this.getCurrentPlan()
                .then(plan => {
                    const planSlug = plan ? (plan.slug || '') : '';
                    const profile_ = Object.assign(profile, {plan: planSlug});

                    return Promise.resolve(profile_);
                });
        });
};

/**
 * Get object profile by id.
 *
 * @param id
 * @returns {Promise}
 */
User.statics.getProfileById = function (id) {
    return this.findById(id)
        .then((user) => {
            if (!user) {
                return Promise.resolve(null);
            }

            return user.getProfile();
        });
};

/**
 * Change membership.
 *
 * @param userId
 * @param planId
 * @returns {Promise<*[]>}
 */
User.statics.changeMembership = function (userId, planId) {
    return this.findById(userId)
        .then(user => {
            if (!user) {
                return Promise.reject(new Error('User not found!'));
            }

            return Promise.resolve(user);
        })
        .then((user) => {
            return Membership.createMembership(userId, planId)
                .then(membership => {
                    return Promise.resolve([user, membership]);
                });
        })
        .then(([user, membership]) => {
            user.membership = membership.get('_id');

            return user.save();
        });
};

/**
 * Check has role.
 *
 * @param role
 * @returns {*}
 */
User.methods.hasRole = function (role) {
    const roles = this.get('roles') || [];

    if (roles.indexOf(role) === -1) {
        return Promise.reject(roles);
    }

    return Promise.resolve(roles);
};

/**
 * Get scopes by roles.
 *
 * @returns {Promise<Array>}
 */
User.methods.getScopesByRoles = function () {
    const roles = this.get('roles') || [];

    return authHelpers.getScopesByRoles(roles);
};

/**
 * Get current plan.
 */
User.methods.getCurrentPlan = function () {
    const that = this;
    const membershipId = that.get('membership');

    if (membershipId) {
        return Promise.resolve(false);
    }

    return Membership.getMembershipById(membershipId)
        .then(membership => {
            if (!membership || !membership.plan) {
                return Promise.resolve(false);
            }

            const {plan} = membership;

            return (plan && Object.keys(plan).length) ? Promise.resolve(plan) : Promise.resolve(false);
        })
        .catch(error => {
            return Promise.resolve(false);
        });
};

/**
 * Get scopes.
 *
 * @returns {Promise<T>}
 */
User.methods.getScopes = function () {
    const that = this;

    return this.getScopesByRoles()
        .then(scopes => {
            const membershipId = that.get('membership');
            if (!membershipId) {
                return Promise.resolve(scopes);
            }

            return Membership.findById(membershipId)
                .then(membership => {
                    if (!membership) {
                        return Promise.resolve([]);
                    }

                    return membership.getScopes();
                })
                .then(scopes_ => {
                    scopes = scopes.concat(scopes_);

                    return Promise.resolve(scopes);
                });
        })
        .then(scopes => {
            return Promise.resolve(_.uniq(scopes));
        });
};

/**
 * Save settings.
 *
 * @param settings
 *
 * @return {Promise<T>}
 */
User.methods.saveSettings = function (settings) {
    const that = this;

    const currentSettings = this.settings || {};
    const updatedSettings = Object.assign(currentSettings, settings);

    return this
        .update({
            $set: {
                settings: updatedSettings
            }
        })
        .then(() => {
            return Promise.resolve(that);
        });
};

/**
 * Save meta.
 *
 * @param meta
 *
 * @return {Promise<T>}
 */
User.methods.saveMeta = function (meta) {
    const that = this;

    const currentMeta = this.meta || {};
    const updatedMeta = Object.assign(currentMeta, meta);

    return this
        .update({
            $set: {
                meta: updatedMeta
            }
        })
        .then(() => {
            return Promise.resolve(that);
        });
};

/**
 * Get referral id.
 *
 * @return {Promise<string>}
 */
User.methods.getReferralId = function () {
    const {referral_id} = this;

    if (!_.isEmpty(referral_id)) {
        return Promise.resolve(referral_id);
    }

    const newReferralId = shortId.generate();

    return this
        .update({
            $set: {
                referral_id: newReferralId
            }
        })
        .then(() => {
            return Promise.resolve(newReferralId)
        });
};

User.methods.toJSON = function () {
    let object = this.toObject();

    delete object['password'];
    delete object['__v'];

    return object;
};

//method get affiliate code and create if not exist
User.methods.getAffiliateCode = async function () {
    const that = this.model('User');
    let code = this.affiliateCode
    if (!code) {
        code = await that.createAffiliateCode()
        this.affiliateCode = code
        await this.save()
    }
    return code
}

// method create affiliate code
User.statics.createAffiliateCode = async function () {
    const that = this.model('User');
    let code = Math.random().toString(36).substring(2, 10).toUpperCase()
    const user = await that.findOne({affiliateCode: code}).lean()
    if (user) {
        code = that.createAffiliateCode()
    }
    return code
}

/**
 * Save phone number.
 * @param phoneNumber
 * @returns {*}
 */
User.methods.savePhoneNumber = function (phoneNumber) {
    const that = this;

    return this
        .update({
            $set: {
                phoneNumber: phoneNumber
            }
        })
        .then(() => {
            return Promise.resolve(that);
        });
};

module.exports = conn.model('User', User);

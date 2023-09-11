const Moment = require('moment');
const conn = require('../app.database');
const Plan = require('./Plan');
const {getTimeLater} = require('../helpers/TimeHelpers');
const {Membership} = require('tamz-schemas-database/schemas');

Membership.methods.isExpired = function (delayDays = 0) {
    const finish = this.get('finish');
    const momentFinish = Moment(finish).add(delayDays, 'days');
    const tomorrow = Moment();

    return tomorrow.isAfter(momentFinish);
};

Membership.statics.createMembership = function (owner, planId) {
    const that = this;

    return Plan.findById(planId)
        .then(plan => {
            if (!plan) {
                return Promise.reject(new Error('Plan not found!'));
            }

            return Promise.resolve(plan);
        })
        .then(plan => {
            const durationAmount = plan.get('durationAmount') || 1;
            const durationUnit = plan.get('durationUnit') || 'month';

            const newMembership = new that({
                owner,
                plan: plan.get('_id'),
                start: Date.now(),
                finish: getTimeLater(durationAmount, durationUnit)
            });

            return newMembership.save();
        });
};

Membership.statics.getMembershipById = function (membershipId) {
    return this.findById(membershipId)
        .then(membership => {
            if (!membership) {
                return Promise.reject(new Error('Membership not found!'));
            }

            return Promise.resolve(membership);
        })
        .then(membership => {
            const planId = membership.get('plan');

            if (!planId) {
                return Promise.resolve(membership);
            }

            return Plan.findById(planId)
                .then(plan => {
                    if (!plan) {
                        return Promise.reject(new Error('Plan not found!'));
                    }

                    return Promise.resolve(plan);
                })
                .then(plan => {
                    const membership_ = Object.assign(membership.toJSON(), {plan: plan.toJSON()}, {
                        isExpired: membership.isExpired()
                    });

                    return Promise.resolve(membership_);
                });
        });
};

Membership.methods.getScopes = function () {
    const planId = this.get('plan');
    const isExpired = this.isExpired(1);

    if (isExpired) {
        return Promise.resolve([]);
    }

    return Plan.findById(planId)
        .then(plan => {
            if (!plan) {
                return Promise.resolve([]);
            }

            return plan.getCapabilities();
        });
};

module.exports = conn.model('Membership', Membership);
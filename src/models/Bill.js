const conn = require('../app.database');
const User = require('./User');
const _ = require('lodash');
const {BILL_COMPLETED, BILL_CREATED} = require("../constants/Events");
const {emitEvent} = require("../services/EventServices");

const {Bill} = require('tamz-schemas-database/schemas');

Bill.statics.createBill = function ({title, planId, price, currency, userId, meta = {}, status = 'pending'}) {
    const bill = new this({
        title,
        owner: userId,
        plan: planId,
        price,
        currency,
        status,
        extend: meta
    });

    return bill.save()
        .then(b => {
            emitEvent(BILL_CREATED, b);

            return Promise.resolve(b);
        });
};

Bill.statics.duplicateBill = function (bill) {
    const title = bill.get('title');
    const owner = bill.get('owner');
    const plan = bill.get('plan');
    const price = bill.get('price');
    const currency = bill.get('currency');
    const extend = bill.get('extend');
    const {receiver_email} = extend;

    const newBill = new this({
        title,
        owner,
        plan,
        price,
        currency,
        extend: {
            receiver_email,
            created: Date.now()
        }
    });

    return newBill.save()
        .then(b => {
            emitEvent(BILL_CREATED, b);

            return Promise.resolve(b);
        });
};

Bill.methods.completed = function ({extend, method}) {
    const that = this;

    const plan = this.get('plan');
    const owner = this.get('owner');

    return User.changeMembership(owner, plan)
        .then(user => {
            const extend_ = Object.assign(that.extend, extend);

            let $set = {
                status: 'completed',
                extend: extend_,
                updated: Date.now()
            };

            if (!_.isEmpty(method)) {
                $set = Object.assign({}, $set, {method});
            }

            return that
                .update(
                    {
                        $set,
                    },
                    {
                        new: true
                    }
                )
                .then(() => {
                    return that.save();
                });
        }).then(bill => {
            emitEvent(BILL_COMPLETED, bill);

            return Promise.resolve(bill);
        });
};


Bill.statics.getBillById = function (billId) {
    return this.findById(billId)
        .populate('owner');
};

module.exports = conn.model('Bill', Bill);
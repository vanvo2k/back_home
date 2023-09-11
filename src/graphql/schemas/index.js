const customScalars = require('./custom-scalars');
const favorite = require('./favorite');
const itemProduct = require('./item-product');
const myAnalytic = require('./my-analytic');

module.exports = () => [
    customScalars,
    favorite,
    itemProduct,
    myAnalytic
];

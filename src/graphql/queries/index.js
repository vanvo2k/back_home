const itemProduct = require("./item-product");
const favorite = require("./favorite");
const myAnalytic = require("./my-analytic");

module.exports = () => [
    itemProduct,
    favorite,
    myAnalytic
];
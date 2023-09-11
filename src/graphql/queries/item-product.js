module.exports = `
extend type Query {
    item(id: ID): ItemProduct,
    items(limit: Int = 10): [ItemProduct],
    hello: String
}
`;
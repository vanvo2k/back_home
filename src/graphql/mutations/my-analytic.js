module.exports = `

extend type Mutation {
    createMyAnalytic(title: String, args: String!, analyticId: ID): MyAnalytic,
    deleteMyAnalytic(id: ID!): Boolean,
}
`;
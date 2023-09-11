module.exports = `
type FavoritesResult {
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
    docs: [ItemProduct]
}

extend type Query {
    favorites(page: Int = 1, limit: Int = 10): FavoritesResult,
}
`;
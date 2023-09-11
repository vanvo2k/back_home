const ItemProduct = `
type RankHistory {
    rank: Int,
    timestamp: String
}

type PriceHistory {
    price: Float,
    timestamp: String
}

type ItemProduct {
    _id: ID,
    ASIN: String,
    link: String,
    name: String,
    description: String,
    alive: Boolean,
    brand: String,
    features: [String],
    thumbnail: String,
    thumbnailCropped: String,
    rank: Int,
    ranks: [RankHistory],
    price: Float,
    prices: [PriceHistory],
    last_updated_at: String,
    date_first_available: String,
    created: String,
    deleted_at: String,
    type: String,
    trendy: Float,
    trending: Float,
    computed: JSON
}
`;

module.exports = ItemProduct;
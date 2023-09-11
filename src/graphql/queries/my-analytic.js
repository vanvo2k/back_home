module.exports = `
type MyAnalyticsResult {
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
    docs: [MyAnalytic]
}

extend type Query {
    myAnalytics(page: Int = 1, limit: Int = 10): MyAnalyticsResult,
}
`;
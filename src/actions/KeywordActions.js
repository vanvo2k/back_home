const KeywordServicesV2 = require('../services/KeywordServicesV2')
const Moment = require('moment')

exports.getOptions = () => {
    return KeywordServicesV2.getOptions()
}

exports.getKeywords = ({date, maxRank, length, page, limit}) => {
    return KeywordServicesV2.getKeywords({date, maxRank, length, page, limit})
}

exports.getListKeywordsV2 = ({term, date, maxRank, page, limit}) => {
    const updateTime = Moment('09-05-2018', 'DD-MM-YYYY')
    const timeMoment = Moment(date, 'DD-MM-YYYY')

    const counts = timeMoment.isBefore(updateTime) ? [3, 2, 1] : [4, 3, 2]
    const promises = counts.map(count => KeywordServicesV2.getKeywords({
        term,
        date,
        page,
        limit,
        maxRank,
        length: count
    }))

    return Promise.all(promises).then((results) => {
        let currentPage = 1,
            totalPages = 0,
            totalResult = 0,
            count = 1,
            maxLimit = 0

        results.forEach((result) => {
            const {page, pages, limit, total, length} = result

            if (page) {
                currentPage = page
            }

            if (pages > totalPages) {
                totalPages = pages
            }

            if (limit > maxLimit) {
                maxLimit = limit
            }

            if (total > totalResult) {
                totalResult = total
            }

            if (length) {
                count = length
            }
        })

        const resultsComputed = results.map(result => {
            const {docs, length} = result

            return {
                count: length,
                docs
            }
        })

        return Promise.resolve({
            results: resultsComputed,
            meta: {
                page: currentPage,
                pages: totalPages,
                limit: maxLimit,
                total: totalResult
            }
        })
    })
}


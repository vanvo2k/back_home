const elastic = require('../src/connections/elasticsearch')
const appConfig = require('../src/app.config')
const Item = require('../src/models/Item')
const indexing = appConfig.get('/elasticIndexing')
const Promise = require('bluebird')
const isNumeric = require('../src/helpers/isNumeric')

const LIMIT = 100

const _fetch = (searchAfter = null) => {
    const searchAfterValidated = Array.isArray(searchAfter) && searchAfter.length ? searchAfter : false

    const bodySearch = {
        size: LIMIT,
        stored_fields: [],
        sort: [
            {
                _uid: 'asc'
            }
        ]
    }

    if (searchAfterValidated) {
        bodySearch.search_after = searchAfterValidated
    }

    return elastic.search({
        index: indexing.index,
        type: indexing.type,
        body: bodySearch
    }).then(result => {
        const {hits} = result
        const {total} = hits

        let after = null
        const ids = hits.hits.map(doc => {
            after = doc.sort

            return doc._id
        })

        return {
            ids,
            total,
            after
        }
    })
}

const _updateToElastic = (product) => {
    const {_id, rank} = product
    const productId = _id.toString ? _id.toString() : _id

    const rankValidated = rank === null || rank === undefined || !isNumeric(rank) ? 0 : parseInt(rank, 10)

    return elastic.update({
        index: indexing.index,
        type: indexing.type,
        id: productId,
        body: {
            doc: {
                rank: rankValidated,
            }
        }
    });
}

const _upgrade = ids => {
    return Item
        .find({
            _id: {
                $in: ids
            }
        })
        .select('rank')
        .then(docs => {
            return Promise.map(docs, (doc) => _updateToElastic(doc.toJSON()), {
                concurrency: 10
            })
        })
}

const _run = (total = 0) => (after = null) => {
    return _fetch(after)
        .then(result => {
            const {ids, after} = result
            const currentTotal = total + ids.length

            console.log('Page:', parseInt(currentTotal / LIMIT, 10) + 1)

            return _upgrade(ids)
                .then(() => {
                    if (after) {
                        return _run(currentTotal)(after)
                    }

                    return currentTotal
                })
        })
}

_run()().then((total) => {
    console.log('done', total)
})
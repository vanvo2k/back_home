const elastic = require('../src/connections/elasticsearch')
const appConfig = require('../src/app.config')
const Item = require('../src/models/Item')
const indexing = appConfig.get('/elasticIndexing')
const Promise = require('bluebird')
const Mongoose = require('mongoose')

//Mongoose.set('debug', true)
const LIMIT = 1000

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

let notExists = 0

const _checkSync = (productId) => {
    return Item.find({_id: productId})
        .select('_id')
        .limit(1)
        .lean()
        .then(product => {
            if (!product || !product.length) {
                console.log('not found', productId)

                notExists++
            }

            return true
        })

}

const _upgrade = ids => {
    const start = Date.now()

    return Promise.map(ids, (id) => _checkSync(id), {
        concurrency: 100
    }).then(() => {
        const finish = Date.now()
        console.log('time', finish - start, notExists)

        return true
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
    console.log('done', total, notExists)
})
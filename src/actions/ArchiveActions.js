const {MAX_PAGE} = require("../constants/Common");
const SearchArchiveServices = require('../services/SearchArchiveServices');
const Item = require('../models/Item')
const AmazonHelpers = require('../helpers/AmazonHelpers');

const getItemByID = (itemId, select = '') => {
    return Item.findById(itemId)
        .select(select)
        .then(item => {
            if (!item) {
                return Promise.reject(new Error('Product not found!'))
            }

            return Promise.resolve(item)
        })
}

const _fetchItems = (ids) => {
    return Item
        .find({
            _id: {
                $in: ids
            }
        })
        .select('_id thumbnail date_first_available cropped thumbnailCropped')
        .lean()
        .then(items => {
            let objectItems = {}

            items.forEach(item => {
                const id = item._id
                objectItems = Object.assign({}, objectItems, {[id]: item})
            })

            return Promise.resolve(objectItems)
        })
}

exports.search = ({page, limit, query, rank, price, availableText, dateText, sortBy, type, category = '', brandType, excludeIds = [], aggs = {}, market = 'us'}) => {
    page = page > 0 ? parseInt(page, 10) : 1;
    limit = limit > 0 ? parseInt(limit, 10) : 10;
    const field = sortBy ? sortBy.field : '';
    const fieldSortBy = field ? field : 'rank';
    const limitValidated = limit <= 100 ? limit : 100;
    const pageValidated = page <= MAX_PAGE ? page : 1;

    const start = Date.now();
    return SearchArchiveServices.searchArchiveItems({
        page: pageValidated,
        limit: limitValidated,
        query,
        rank,
        price,
        availableText,
        dateText,
        type,
        category,
        brandType,
        sortBy: {field: fieldSortBy},
        excludeIds,
        aggs,
        market
    }).then(result => {
        const {items, total, aggregations, ids} = result;

        return _fetchItems(ids)
            .then(itemsById => {
                const computedItems = items
                    .filter(item => {
                        const {_id} = item
                        return !!itemsById[_id]
                    })
                    .map((item) => {
                        const {_id, _source} = item
                        let computedItem = _source

                        const object = itemsById[_id]

                        const {thumbnailCropped} = computedItem
                        const preview = thumbnailCropped ? object.thumbnailCropped : object.thumbnail || ''

                        delete computedItem.ASIN
                        delete computedItem.link
                        delete computedItem.crawled

                        return Object.assign({}, computedItem, object, {preview})
                    })
                return {
                    items: computedItems,
                    total,
                    aggregations
                }
            })
    }).then(({items, total, aggregations}) => {
        const totalPages = Math.ceil(total / limit) || 1;
        const stop = Date.now();
        console.log('SEARCH TIME', stop - start, totalPages);

        const totalPagesValidated = totalPages <= MAX_PAGE ? totalPages : MAX_PAGE

        return {
            docs: items,
            limit,
            page,
            total,
            pages: totalPagesValidated,
            aggregations
        }
    })
}

exports.getProductDetail = (productId, dateText) => {
    return SearchArchiveServices.itemDetailInHistoricalDay({productId, dateText})
        .then(result => {
            const {item} = result;

            return getItemByID(productId, 'description ranks features cropped thumbnail thumbnailCropped')
                .then(product => {
                    const object = product.toJSON();

                    const cropped = !!object.cropped
                    const preview = cropped ? object.thumbnailCropped : object.thumbnail || '';

                    delete object.thumbnail;
                    delete object.thumbnailCropped

                    const features = Array.isArray(object.features) ? object.features : [];
                    const indexFeatures = features.map((_, index) => index)
                    const featuresSorted = indexFeatures.sort((index, anotherIndex) => {
                        const isAutoA = AmazonHelpers.isAutoFeature(features[index])
                        const isAutoB = AmazonHelpers.isAutoFeature(features[anotherIndex])

                        if (isAutoA && !isAutoB) {
                            return 1
                        }

                        if (isAutoB && !isAutoA) {
                            return -1
                        }

                        return 0
                    })

                    return Object.assign({}, object, item, {
                        preview,
                        features,
                        featuresSorted
                    })

                })
        })
}

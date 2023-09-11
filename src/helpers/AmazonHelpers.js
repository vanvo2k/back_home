exports.detectASIN = (query) => {
    if (!query || !query.length) {
        return false
    }

    if (query.length !== 10) {
        return false
    }

    const regex = /^(B0)[\dA-Z]+/g
    const parsed = regex.exec(query)
    if (!parsed || parsed.length !== 2) {
        return false
    }

    return parsed[0] === query
}

const stopWords = [
    "i",
    "t-shirt",
    "lover",
    "lovers",
    "gift",
    "shirt",
    "hoodie",
    "tee",
    "t",
    "shirts",
    "mens",
    "girls",
    "you",
    "awesome",
    "and",
    "me",
    "birthday",
    "funny",
    "men",
    "women",
    "old",
    "of",
    "the",
    "is",
    "last",
    "day",
    "for",
    "i'm",
    "my",
    "favorite",
    "be",
    "a",
    "idea",
    "don't",
    "doesn't",
    "like",
    "premium",
    "vintage",
    "retro",
    "&",
    "tshirt",
    "gradient",
    "can't",
    "'m",
    "not",
    "'re",
    "'s",
    "'d",
    "'ve",
    "n't",
    "there",
    "this",
    "that",
    "it",
    "\ -\ ",
    "your",
    "father",
    "long\ sleeve",
    "sweatshirt",
    "classic\ fade",
    "cute\ funny",
    "funny\ cute"
]

const _uniqueWords = (string) => {
    return (string + "").trim().split(' ').filter((item, index, allItems) => index === allItems.indexOf(item)).join(' ')
}

exports.filterStopWords = (title) => {
    const validateTitle = (title + "").toLowerCase()

    const regex = new RegExp('\\b(' + stopWords.join('|') + ')\\b', 'g')
    const filtered = validateTitle.replace(/,/g, '').replace(regex, ' ').replace(/\s\s+/g, ' ').trim()

    return _uniqueWords(filtered)
}

const excludedFeatures = [
    'Imported',
    '100% Cotton',
    'Solid colors:',
    'Lightweight, Classic fit',
    'This premium t-shirt is made',
    'Classic fit, Twill-taped',
    'Machine wash cold with like colors'
]

exports.isAutoFeature = feature => {
    if (!feature) {
        return true
    }

    for (let i = 0; i < excludedFeatures.length; i++) {
        const excluded = excludedFeatures[i]

        if (feature.indexOf(excluded) !== -1) {
            return true
        }
    }

    return false
}

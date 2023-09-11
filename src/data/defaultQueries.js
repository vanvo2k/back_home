module.exports = () => {
    return [
        {
            title: 'Shirts Listed < 2 days x Rank < 200,000',
            description: 'Shirts have just gone live within 2 days but already reached rank < 200,000',
            args: {
                "filter": {
                    "status": "all",
                    "type": "all",
                    "brandType": "all",
                    "rank": {
                        "from": "",
                        "to": 200000
                    },
                    "timeAvailable": {
                        "from": "2-day-ago",
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "rank"
                }
            }
        },
        {
            title: 'Shirts Listed < a day x Rank < 500,000',
            description: 'Shirts have just gone live less than a day but already reached rank < 500,000',
            args: {
                "filter": {
                    "status": "all",
                    "type": "all",
                    "brandType": "all",
                    "rank": {
                        "from": "",
                        "to": 500000
                    },
                    "timeAvailable": {
                        "from": "1-day-ago",
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "rank"
                }
            }
        },
        {
            title: 'Shirts Bestsellers of Unofficial brands',
            description: 'Bestseller shirts for Unofficial Brands only, excluded Official Brands',
            args: {
                "search": {
                    "type": "all_words"
                },
                "filter": {
                    "status": "alive",
                    "type": "all",
                    "brandType": "unofficial",
                    "rank": {
                        "from": "",
                        "to": 500000
                    },
                    "timeAvailable": {
                        "from": null,
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "rank"
                }
            }
        },
        {
            title: 'Shirts BSR Surge x Rank < 500,000 x Unofficial',
            description: 'Shirts had BSR suddenly surged over Rank <500,000 of Unofficial brands only',
            args: {
                "search": {
                    "type": "all_words"
                },
                "filter": {
                    "status": "alive",
                    "type": "all",
                    "brandType": "unofficial",
                    "rank": {
                        "from": "",
                        "to": 500000
                    },
                    "timeAvailable": {
                        "from": null,
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "trending"
                }
            }
        },
        {
            title: 'PopSockets Bestsellers',
            description: 'Bestseller items of PopSockets',
            args: {
                "search": {
                    "type": "all_words"
                },
                "filter": {
                    "status": "alive",
                    "type": "popsockets",
                    "brandType": "all",
                    "rank": {
                        "from": "",
                        "to": 1000000
                    },
                    "timeAvailable": {
                        "from": null,
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "rank"
                }
            }
        },
        {
            title: 'Sweatshirts Rank < 500,000 x Alive',
            description: 'Bestseller Sweatshirts with Rank < 500,000 and Alive status',
            args: {
                "filter": {
                    "status": "alive",
                    "type": "sweatshirt",
                    "brandType": "all",
                    "rank": {
                        "from": "",
                        "to": 1000000
                    },
                    "timeAvailable": {
                        "from": null,
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "rank"
                }
            }
        },
        {
            title: 'Standard T-shirts Listed < 1 week x Price > $21 x Rank < 500,000 x Unofficial',
            description: 'Standard T-shirts listed less than a week, priced lower than $21, ranked < 500,000 from Unofficial Brands',
            args: {
                "filter": {
                    "status": "alive",
                    "type": "standard",
                    "brandType": "unofficial",
                    "rank": {
                        "from": "",
                        "to": 500000
                    },
                    "timeAvailable": {
                        "from": "7-day-ago",
                        "to": null
                    },
                    "price": {
                        "from": 21,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "rank"
                }
            }
        },
        {
            title: 'All Trump Shirts in Bestseller order',
            description: 'All shirts about Trump, including Alive and Dead ones, ordered by rank ascending',
            args: {
                "search": {
                    "type": "at_least_one",
                    "term": "trump"
                },
                "filter": {
                    "status": "all",
                    "type": "all",
                    "brandType": "all",
                    "rank": {
                        "from": "",
                        "to": ""
                    },
                    "timeAvailable": {
                        "from": null,
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "rank"
                }
            }
        },
        {
            title: 'All Anti-Trump Shirts in Bestseller order',
            description: 'All shirts about Anti-Trump, including Alive and Dead ones, ordered by rank ascending',
            args: {
                "search": {
                    "type": "at_least_one",
                    "term": "antitrump anti-trump"
                },
                "filter": {
                    "status": "all",
                    "type": "all",
                    "brandType": "all",
                    "rank": {
                        "from": "",
                        "to": ""
                    },
                    "timeAvailable": {
                        "from": null,
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "rank"
                }
            }
        },
        {
            title: 'All Family Shirts with BSR Surge',
            description: 'All shirts about Family, ordered by rank surging percentage',
            args: {
                "search": {
                    "type": "at_least_one",
                    "term": "family father dad fathers daddy dads uncle aunt nana sister sibling daugher son "
                },
                "filter": {
                    "status": "alive",
                    "type": "all",
                    "brandType": "all",
                    "rank": {
                        "from": "",
                        "to": ""
                    },
                    "timeAvailable": {
                        "from": null,
                        "to": null
                    },
                    "price": {
                        "from": 0,
                        "to": 0
                    }
                },
                "sort": {
                    "field": "trending"
                }
            }
        }
    ];
};
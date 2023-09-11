const Confidence = require('confidence');

const config = {
    secretKey: '_tamz_',
    port: {
        $filter: "env",
        $default: 6978,
        staging: 6979,
        production: 6978
    },
    portHTTPS: {
        $filter: 'env',
        $default: 6789,
        staging: 6789,
        production: 6789
    },
    mongodb: {
        $filter: "env",
        $default: `mongodb://root:${encodeURIComponent('5~sJYae>kfvQC_Pg')}@185.193.17.44:27017/spyamz_dev?authSource=admin`,
        staging: process.env.MONGODB_URI || `mongodb://root:${encodeURIComponent('5~sJYae>kfvQC_Pg')}@localhost:27017/spyamz_dev?authSource=admin`,
        _production: 'mongodb://teeamz:gNS75pZWjxGfXsyN@172.22.30.122:27017/teeamz_app',
        production: 'mongodb://teeamz:gNS75pZWjxGfXsyN@localhost:27017/teeamz_app',
    },
    redisKeyword: {
        $filter: "env",
        $default: {
            host: 'localhost',
            port: 6379,
            db: 3
        },
        staging: {
            password: 's74DvupHb7wxYxS8',
            host: 'localhost',
            port: 6379,
            db: 3,
        },
        production: {
            password: 'QWfQnSz2TGfPP9KSetnJ37RypReyAdxX',
            host: '172.22.17.93',
            port: 6379,
            db: 3
        }
    },
    baseUrl: {
        $filter: "env",
        $default: 'http://localhost:3000/api',
        staging: 'https://dev-merch.spyamz.com',
        production: 'https://prod.spyamzservices.com',
    },
    elasticSearch: {
        $filter: "env",
        $default: "http://spy126:EUaNXfPke3h99AZB@elasticsearch.spy126.com",//process.env.ELASTICSEARCH_URI || 'http://localhost:9200',
        staging: process.env.ELASTICSEARCH_URI || 'http://elastic:QwGknzkgn4Jyjhc8@127.0.0.1:9200',
        _production: "https://spy126:EUaNXfPke3h99AZB@elasticsearch.spy126.com",
        production: 'http://157.230.56.93:9200',
    },
    elasticLogging: {
        $filter: "env",
        $default: "http://spy126:EUaNXfPke3h99AZB@elasticsearch.spy126.com",//process.env.ELASTICSEARCH_URI || 'http://localhost:9200',
        staging: process.env.ELASTICSEARCH_URI || 'http://elastic:QwGknzkgn4Jyjhc8@127.0.0.1:9200',
        _production: "https://spy126:EUaNXfPke3h99AZB@elasticsearch.spy126.com",
        production: 'http://157.230.56.93:9200',
    },
    trendsIndexing: {
        $filter: "env",
        $default: {
            index: 'tamz_trends',
            type: 'items'
        },
        staging: {
            index: 'tamz_trends_dev',
            type: 'items'
        },
        _production: {
            index: 'tamz_trends',
            type: 'items'
        },
        production: {
            index: 'tamz_trends',
            type: 'items'
        },
    },
    elasticIndexing: {
        $filter: "env",
        $default: {
            // index: 'spyamz_dev',
            index: 'tamz',
            type: 'items'
        },
        staging: {
            index: 'tamz_dev',
            type: 'items'
        },
        _production: {
            index: 'tamz',
            type: 'items'
        },
        production: {
            index: 'tamz',
            type: 'items'
        },
    },
    keywordsIndexing: {
        $filter: "env",
        $default: {
            index: 'spyamz_keyword',
            type: 'keyword_by_date'
        },
        staging: {
            index: 'spyamz_keyword',
            type: 'keyword_by_date'
        },
        _production: {
            index: 'spyamz_keyword',
            type: 'keyword_by_date'
        },
        production: {
            index: 'spyamz_keyword',
            type: 'keyword_by_date'
        },
    },
    spyggsIndexing: {
        $filter: "env",
        $default: {
            index: 'spyggs',
            type: 'items'
        },
        staging: {
            index: 'spyggs',
            type: 'items'
        },
        _production: {
            index: 'spyggs',
            type: 'items'
        },
        production: {
            index: 'spyggs',
            type: 'items'
        }
    },
    webClient: {
        $filter: "env",
        $default: 'https://localhost:3000',
        staging: 'https://dev-merch.spyamz.com',
        production: 'https://merch.spyamz.com',
    },
    socket: {
        $filter: "env",
        $default: {
            path: '/socket__'
        },
        production: {
            path: '/socket__'
        }
    },
    PayPal: {
        $filter: "env",
        $default: {
            endpoint: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
            receiver: 'tutv95-facilitator@gmail.com',
            return_: '/settings/billing',
            cancel_return: '/settings/billing',
            notify_url: '/paypal/ipn',
            ipn_endpoint: 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
        },
        staging: {
            endpoint: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
            receiver: 'tutv95-facilitator@gmail.com',
            return_: '/settings/billing',
            cancel_return: '/settings/billing',
            notify_url: '/paypal/ipn',
            ipn_endpoint: 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
        },
        production: {
            endpoint: 'https://www.paypal.com/cgi-bin/webscr',
            receiver: 'paypal@foobla.com',
            return_: '/settings/billing',
            cancel_return: '/settings/billing',
            notify_url: '/paypal/ipn',
            ipn_endpoint: 'https://ipnpb.paypal.com/cgi-bin/webscr',
        }
    },
    auth: {
        facebook: {
            $filter: "env",
            $default: {
                clientID: '380442572375167',
                clientSecret: '53e03deb48d6b0e9cbcda67cbc1ef5ca',
                callbackURL: "https://localhost:3000/api/auth/facebook/callback",
                profileFields: ['id', 'displayName', 'name', 'gender', 'photos', 'email']
            },
            staging: {
                clientID: '380442572375167',
                clientSecret: '53e03deb48d6b0e9cbcda67cbc1ef5ca',
                callbackURL: "/auth/facebook/callback",
                profileFields: ['id', 'displayName', 'name', 'gender', 'photos', 'email']
            },
            production: {
                clientID: '380442572375167',
                clientSecret: '53e03deb48d6b0e9cbcda67cbc1ef5ca',
                callbackURL: "/auth/facebook/callback",
                profileFields: ['id', 'displayName', 'name', 'gender', 'photos', 'email']
            }
        },
        google: {
            $filter: "env",
            $default: {
                clientID: '662554059659-p2r47v1fqpkt4en300ssas4juqnmii6k.apps.googleusercontent.com',
                clientSecret: 'L1g8lyKwxBKRBhaVNYw9A4a9',
                callbackURL: "http://localhost:6978/auth/google/callback"
            },
            staging: {
                clientID: '662554059659-p2r47v1fqpkt4en300ssas4juqnmii6k.apps.googleusercontent.com',
                clientSecret: 'L1g8lyKwxBKRBhaVNYw9A4a9',
                callbackURL: "https://dev-merch.spyamz.com/api/auth/google/callback"
            },
            production: {
                clientID: '662554059659-p2r47v1fqpkt4en300ssas4juqnmii6k.apps.googleusercontent.com',
                clientSecret: 'L1g8lyKwxBKRBhaVNYw9A4a9',
                callbackURL: "https://prod.spyamzservices.com/app/auth/google/callback",
            }
        }
    },
    sentry: {
        $filter: "env",
        $default: {
            dsn: "https://2e328ef4f7df4cc99cc4561455ea3bd3:575057f37c8d44ccb66fce1f5d1cbbb7@sentry.io/262564"
        },
        staging: {
            dsn: "https://2e328ef4f7df4cc99cc4561455ea3bd3:575057f37c8d44ccb66fce1f5d1cbbb7@sentry.io/262564"
        },
        production: {
            dsn: "https://2e328ef4f7df4cc99cc4561455ea3bd3:575057f37c8d44ccb66fce1f5d1cbbb7@sentry.io/262564"
        }
    },
    tapfiliate: {
        $filter: "env",
        $default: {
            apiKey: "1f2ba991bbbd6e48e6cc73636a4b05edd1901b21"
        },
        staging: {
            apiKey: "1f2ba991bbbd6e48e6cc73636a4b05edd1901b21"
        },
        production: {
            apiKey: "1f2ba991bbbd6e48e6cc73636a4b05edd1901b21"
        }
    },
    redisSession: {
        $filter: "env",
        $default: {
            host: 'localhost',
            port: 6379,
            // host: '172.22.17.93',
            // port: 6379,
            // password: 'QWfQnSz2TGfPP9KSetnJ37RypReyAdxX',
            db: 4
        },
        staging: {
            password: 's74DvupHb7wxYxS8',
            host: 'localhost',
            port: 6379,
            db: 5,
        },
        production: {
            password: 'QWfQnSz2TGfPP9KSetnJ37RypReyAdxX',
            host: '172.22.17.93',
            port: 6379,
            db: 4
        }
    },
    nats: {
        $filter: 'env',
        $default: {
            url: "nats://127.0.0.1:4222",
            json: true,
        },
        staging: {
            url: "nats://127.0.0.1:4222",
            json: true,
        },
        _production: {
            url: "nats://127.0.0.1:4222",
            json: true,
        },
        production: {
            url: "nats://172.22.30.122:4222",
            json: true,
            user: 'spyamz',
            pass: 'AWwAahyzYmDo1DduGKco6hbJ3e1eE14P'
        }
    },
};

const store = new Confidence.Store(config);
const criteria = {
    env: process.env.NODE_ENV || 'development'
};

module.exports.get = (key, defaultValue = null) => {
    return store.get(key, criteria) || defaultValue;
};

module.exports.meta = function (key) {
    return store.meta(key, criteria);
};

const {Subject} = require('rxjs');

const _subject = new Subject();
const observable = _subject.asObservable();

exports.onEvent = (key) => {
    return observable.filter(args => {
        return (args.key === key);
    }).map(args => {
        return args.data || null;
    });
};

exports.emitEvent = (key, data) => {
    return _subject.next({
        key,
        data
    });
};
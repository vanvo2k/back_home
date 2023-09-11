/**
 * Obfuscate a plaintext string with a simple rotation algorithm similar to
 * the rot13 cipher.
 * @param  {Number} key rotation index between 0 and n
 * @param  {Number} n   maximum char that will be affected by the algorithm
 * @return {String}     obfuscated string
 */
String.prototype.obfs = function (key, n = 126) {
    // return String itself if the given parameters are invalid
    if (!(typeof(key) === 'number' && key % 1 === 0)
        || !(typeof(key) === 'number' && key % 1 === 0)) {
        return this.toString();
    }

    let chars = this.toString().split('');

    for (let i = 0; i < chars.length; i++) {
        const c = chars[i].charCodeAt(0);

        if (c <= n) {
            chars[i] = String.fromCharCode((chars[i].charCodeAt(0) + key) % n);
        }
    }

    return chars.join('');
};

/**
 * De-obfuscate an obfuscated string with the method above.
 * @param  {Number} key rotation index between 0 and n
 * @param  {Number} n   same number that was used for obfuscation
 * @return {String}     plaintext string
 */
String.prototype.defs = function (key, n = 126) {
    // return String itself if the given parameters are invalid
    if (!(typeof(key) === 'number' && key % 1 === 0)
        || !(typeof(key) === 'number' && key % 1 === 0)) {
        return this.toString();
    }

    return this.toString().obfs(n - key);
};

const CommonHelpers = require("./CommonHelpers");

module.exports = (encoded) => {
    const str = encoded.split('.');

    if (str.length < 3) {
        return encoded;
    }

    const sig = parseInt(str[1], 10);
    const payload = encoded.replace('.' + sig + '.', '');
    const base64Encoded = (payload + "").defs(sig);
    const text = CommonHelpers.base64Decode(base64Encoded);

    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
};
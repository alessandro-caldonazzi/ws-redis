function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function isInitial(json) {
    return json.isInitial === true;
}

module.exports = {
    isJson,
    isInitial,
};

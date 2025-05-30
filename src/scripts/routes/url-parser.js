const UrlParser = {
  parseActiveUrlWithCombiner() {
    const url = window.location.hash.slice(1);
    const urlSegments = this._urlSplitter(url);
    return this._combineUrl(urlSegments);
  },

  parseActiveUrlWithoutCombiner() {
    const url = window.location.hash.slice(1);
    return this._urlSplitter(url);
  },

  _urlSplitter(url) {
    const segments = url.split("/");
    return {
      resource: segments[1] || null,
      id: segments[2] || null,
      verb: segments[3] || null,
    };
  },

  _combineUrl({ resource, id, verb }) {
    let combined = `/${resource}`;
    if (id) combined += "/:id";
    if (verb) combined += `/${verb}`;
    return combined;
  },
};

export default UrlParser;

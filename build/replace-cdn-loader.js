// Webpack loader used by self-hosted builds: points the engine's hard-coded asset CDN at our own copies.
// options.from: the CDN prefix to replace, options.to: the replacement prefix.
module.exports = function replaceCdnLoader(source) {
  const { from, to } = this.getOptions();
  return source.split(from).join(to);
};

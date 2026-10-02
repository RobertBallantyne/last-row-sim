const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

// The engine (osrs-sdk) loads shared models from this CDN, which only allows requests from the
// original trainer's own sites. Self-hosted builds point it at our own copies in ./cdn instead.
const ENGINE_CDN = "https://oldschool-cdn.com/";

// The Last Row page shares index.html's shell but runs its own bundle under its own name
const useLastRowBundle = (content) =>
  content
    .toString()
    .replace('src="./main.js"', 'src="./lastrow.js"')
    .replace("<title>Inferno Trainer</title>", "<title>Last Row Sim</title>")
    .replace('content="Inferno Trainer"', 'content="Last Row Sim"');

// the hosted site is only the Last Row, so name the installable web app after it
const lastRowManifest = (content) => {
  const manifest = JSON.parse(content.toString());
  return JSON.stringify({ ...manifest, short_name: "Last Row", name: "Last Row Sim" }, null, 2);
};

// `npx webpack --env selfHosted` builds just the Last Row page, as the site's front page, with the engine's
// models served from ./cdn (regenerated from the game cache) so it works on any host.
module.exports = (env = {}) => {
  const selfHosted = !!env.selfHosted;

  let isDevBuild = false;
  if (!process.env.COMMIT_REF) {
    isDevBuild = true;
    process.env.COMMIT_REF = "local build";
  }
  if (!process.env.BUILD_DATE) {
    isDevBuild = true;
    process.env.BUILD_DATE = "";
  }
  if (!process.env.DEPLOY_URL) {
    isDevBuild = true;
    process.env.DEPLOY_URL = "http://localhost:8000/";
  }

  const pagePatterns = selfHosted
    ? [
        { from: `index.html`, to: "index.html", context: `src/`, transform: useLastRowBundle },
        { from: `index.html`, to: "lastrow.html", context: `src/`, transform: useLastRowBundle },
        { from: `**/*`, to: "cdn/", context: `cdn/` },
      ]
    : [
        { from: `index.html`, to: "", context: `src/` },
        { from: `index.html`, to: "colosseum.html", context: `src/` },
        { from: `index.html`, to: "lastrow.html", context: `src/`, transform: useLastRowBundle },
      ];

  return {
    mode: isDevBuild && !selfHosted ? "development" : "production",
    entry: selfHosted
      ? { lastrow: "./src/lastrow.ts" }
      : { main: "./src/index.ts", lastrow: "./src/lastrow.ts" },
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: '',
      clean: selfHosted,
    },
    devtool: "source-map",
    devServer: {
      contentBase: path.join(__dirname, "dist"),
      compress: true,
      port: 8000,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    // url(https://assets-soltrainer.netlify.app/assets/fonts/RuneScape-UF.woff) format("woff");
    plugins: [
      new CopyPlugin({
        patterns: [
          ...pagePatterns,
          { from: `manifest.json`, to: "", context: `src/`, transform: selfHosted ? lastRowManifest : undefined },
          // GPL v3 (inherited from the Inferno Trainer / osrs-sdk): ship the licence with the site
          { from: `LICENSE`, to: "LICENSE.txt" },
          {
            from: `assets/images/webappicon.png`,
            to: "webappicon.png",
            context: `src/`,
          },
          { from: '*.png', to: "", context: "node_modules/osrs-sdk/_bundles/", noErrorOnMissing: true },
          { from: '*.gif', to: "", context: "node_modules/osrs-sdk/_bundles/", noErrorOnMissing: true },
          { from: '*.ogg', to: "", context: "node_modules/osrs-sdk/_bundles/", noErrorOnMissing: true },
          { from: `assets/fonts/*.woff`, to: "", context: `src/` },
          { from: `assets/fonts/*.woff2`, to: "", context: `src/` },
        ],
      }),
      new webpack.EnvironmentPlugin(["COMMIT_REF", "BUILD_DATE", "DEPLOY_URL"]),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|ogg|gltf|glb)$/i,
          type: "asset/resource",
        },
        {
          test: /\.html$/i,
          loader: "html-loader",
        },
        ...(selfHosted
          ? [
              {
                test: /osrs-sdk[\\/]_bundles[\\/]main\.js$/,
                loader: path.resolve(__dirname, "build/replace-cdn-loader.js"),
                options: { from: ENGINE_CDN, to: "cdn/" },
              },
            ]
          : []),
      ],
    },
  };
};

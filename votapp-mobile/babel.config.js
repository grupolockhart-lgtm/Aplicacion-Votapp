

//votapp-mobile/babel.config.js

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./src"
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"]
        }
      ],
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: "../.env",   // 👈 tu .env está en el padre Aplicacion-Votapp
          safe: false,
          allowUndefined: true
        }
      ]
    ]
  };
};


export default {
  plugins: ["babel-plugin-transform-import-meta" ],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: 'commonjs',
        useBuiltIns: 'usage',
        corejs: { version: 3, proposals: true },
        
      },
    ],
  ],
  sourceType: 'unambiguous',
};

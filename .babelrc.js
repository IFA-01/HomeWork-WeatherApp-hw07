module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: false,
        useBuiltIns: 'usage',
        corejs: { version: 3, proposals: true },
      },
    ],
  ],
  sourceType: 'unambiguous',
};

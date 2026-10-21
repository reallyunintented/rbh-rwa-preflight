export default [
  {
    files: ['src/gates/**', 'src/decoders/**'],
    rules: {
      'no-restricted-globals': ['error', 'Date', 'fetch'],
      'no-restricted-syntax': ['error', {
        selector: "MemberExpression[object.name='process'][property.name='env']",
        message: 'No env reads in gates/decoders',
      }],
    },
  },
];

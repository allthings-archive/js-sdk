import babel from 'rollup-plugin-babel';

export default {
  entry: 'index.js',
  format: 'umd',
  moduleName: 'sdk',
  plugins: [
    babel({
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [ 'es2015-rollup', 'stage-0']

    })
  ]
}

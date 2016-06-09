import babel from 'rollup-plugin-babel'

export default {
  dest: 'dist/index.js',
  entry: 'index.js',
  format: 'cjs',
  moduleName: 'sdk',
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: ['es2015-rollup', 'stage-0']
    })
  ]
}

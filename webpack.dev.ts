import { Configuration } from 'webpack'
import webpackMerge from 'webpack-merge'
import { renderer } from './webpack.common'

const dev: Configuration = {
  mode: 'development',
  devtool: 'inline-source-map',
}

const rendererConfig = webpackMerge(renderer, dev)

export default [rendererConfig]

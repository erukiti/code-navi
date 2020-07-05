import { Configuration } from 'webpack'
import webpackMerge from 'webpack-merge'
import { app } from './webpack.common'

const dev: Configuration = {
  mode: 'development',
  devtool: 'inline-source-map',
}

const rendererConfig = webpackMerge(app, dev)

export default [rendererConfig]

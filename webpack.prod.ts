import { Configuration } from 'webpack'
import webpackMerge from 'webpack-merge'
import { app } from './webpack.common'

const prod: Configuration = {
  mode: 'production',
}

const rendererConfig = webpackMerge(app, prod)

export default [rendererConfig]

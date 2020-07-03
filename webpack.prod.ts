import { Configuration } from 'webpack'
import webpackMerge from 'webpack-merge'
import { renderer } from './webpack.common'

const prod: Configuration = {
  mode: 'production',
}

const rendererConfig = webpackMerge(renderer, prod)

export default [rendererConfig]

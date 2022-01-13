'use strict'

const http = require('http')
const path = require('path')

const _ = require('lodash/fp')

const SOFTWARE_CONFIG = require('../config/software_config.json')
const DEVICE_CONFIG = require('../config/device_config.json')
const LICENSES = require('../config/licenses.json')

function loadConfig(commandLine) {
  const otherConfig = {
  }

  const config = _.mergeAll([{}, DEVICE_CONFIG, SOFTWARE_CONFIG,
    LICENSES, commandLine, otherConfig])
  delete config._

  return config
}

exports.loadConfig = loadConfig;
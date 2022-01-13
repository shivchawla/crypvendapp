// for now, make this b/w compat with trader.js calls

// const axios = require('axios');
import {fetch} from 'react-native-ssl-pinning';

const axiosRetry = require('axios-retry')

import 'react-native-get-random-values';
const uuid = require('uuid')

const forge = require('node-forge');

const argv = {}; //require('minimist')(process.argv.slice(2))

const PORT = argv.serverPort || 3000
const RETRY_INTERVAL = 5000
const RETRY_TIMEOUT = 60000

function retrier (timeout) {
  const maxRetries = timeout / RETRY_INTERVAL

  return (retry, err) => {
    if (err.statusCode && err.statusCode === 403) return 0
    if (retry >= maxRetries) return 0

    return RETRY_INTERVAL
  }
}

function request (configVersion, globalOptions, options) {

  // console.log("In Request");
  // console.log("configVersion");
  // console.log(configVersion);
  // console.log(globalOptions);
  // console.log(options);

  const protocol = globalOptions.protocol
  const connectionInfo = globalOptions.connectionInfo
  const clientCert = globalOptions.clientCert

  if (!connectionInfo) return Promise.resolve()

  const host = protocol === 'http:' ? 'localhost' : connectionInfo.host
  const requestId = uuid.v4()
  const date = new Date().toISOString()
  const headers = {date, 'request-id': requestId}
  if (options.body) headers['content-type'] = 'application/json'
  if (configVersion) headers['config-version'] = configVersion.toString();
  const repeatUntilSuccess = !options.noRetry
  const retryTimeout = options.retryTimeout || RETRY_TIMEOUT

  const retries = repeatUntilSuccess
    ? retrier(retryTimeout)
    : null

  // console.log("In Request"); 
  // const baseURL =  protocol + '//' + '192.168.1.205' + ':' + PORT;
  const baseURL =  'http:' + '//' + host + ':' + PORT;
  console.log(baseURL + options.path);


  //Take this to another module -- like utils
  const cert = forge.pki.certificateFromPem(clientCert.cert);
  const pubKey = forge.pki.publicKeyToPem(cert.publicKey);
  const pubDer = forge.pki.pemToDer(pubKey); 
  const pkb64 = forge.util.encode64(pubDer.data);

  const deviceId = forge.pki.getPublicKeyFingerprint(cert.publicKey, {encoding: 'hex'});
  

  //Pass deviceId in headers - only for localhost
  headers['device-id'] = deviceId;


  // const fetchBody = JSON.stringify({...options.body, deviceId});

  const bodyMethods = ['PUT', 'PATCH', 'POST'];
  
  const fetchOptions = {
    method: options.method,
    timeoutInterval: 10000,
    headers,
    disableAllSecurity: true,
    pkPinning: true,
    sslPinning: {"certs": [`sha1/${pkb64}`]},
    ...bodyMethods.includes(options.method) && {body: JSON.stringify(options.body)}
  };

  // console.log(fetchOptions);

  return fetch(baseURL + options.path, fetchOptions)
  .then(r => {return r.json()})
  .then(r => {
    return {body: r}
  })
  .catch(err => {
    // console.log("Error");
    // console.log(err);
    err = {...JSON.parse(err.bodyString), ...err};
    delete err.bodyString
    throw err;
  })
  
  // const axiosOptions = {
  //   baseURL: 'http:' + '//' + '192.168.1.205' + ':' + PORT,
  //   url: options.path,
  //   method: options.method,
  //   data: options.body,
  //   timeout: 10000,

  //   headers,
  // }

  // console.log(axiosOptions);

  // return axios(axiosOptions)
  // return axiosRetry(axios(axiosOptions), {retries});
}

module.exports = {request}

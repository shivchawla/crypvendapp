const RNFS = require('react-native-fs')
const cryptoJS = require('crypto-js')
// const axios = require('axios')
import {fetch} from 'react-native-ssl-pinning';
const Buffer = require('buffer/').Buffer;
// var Buffer = require('buffer/').Buffer
const forge = require('node-forge')

const baseX = require('base-x')
const querystring = require('querystring')

const E = require('./error')
// const selfSign = require('./self_sign')
var selfSign = require('selfsigned'); //NPM module

const PORT = 3000
const ALPHA_BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'


const cf = require('../data/connection_info.json');
const bsAlpha = baseX(ALPHA_BASE)

// [caHash, token, Buffer.from(hostname)]
function extractHostname (totem) {
  return totem.slice(64).toString()
}

function pair (totemStr, clientCert, connectionInfoPath, model) {
  console.log("In Pair");
  const totem = Buffer.from(bsAlpha.decode(totemStr))
  console.log(totem);
  // const hostname = 'host.name';
  // const hostname = '192.168.1.205'; //extractHostname(totem)
  // const hostname = '108.18.103.158';
  const hostname = extractHostname(totem)
  const expectedCaHash = totem.slice(0, 32).toString('hex')
  const token = totem.slice(32, 64).toString('hex')
  const hexToken = token.toString('hex')
  // const caHexToken = crypto.createHash('sha256').update(hexToken).digest('hex')
  const caHexToken = cryptoJS.SHA256(hexToken).toString(cryptoJS.enc.Hex);

  console.log("In Pair - 2");
  const cert = forge.pki.certificateFromPem(clientCert.cert);

  const pubKey = forge.pki.publicKeyToPem(cert.publicKey);
  const deviceId = forge.pki.getPublicKeyFingerprint(cert.publicKey, {encoding: 'hex'});

  console.log("Finger Print");
  console.log(deviceId)
 
  const pubDer = forge.pki.pemToDer(pubKey); 
  const pkb64 = forge.util.encode64(pubDer.data);

  // console.log("ClientCert");
  // console.log(clientCert);
  // console.log("publicKey");
  // console.log(pkb64);

  const initialOptions = {
    pkPinning: true,
    sslPinning: {
      certs: [`sha1/${pkb64}`]
    },
    disableAllSecurity: true,
    timeoutInterval: 10000
  }

  console.log(initialOptions);

  console.log(`http://${hostname}:${PORT}/ca?token=${caHexToken}`);
  
  //Modified http to https (Change it back when not Dev Mode)
  return fetch(`http://${hostname}:${PORT}/ca?token=${caHexToken}`, initialOptions)
    .then(r => r.json())
    .then(r => {
      console.log("Pair Fetch Response");
      console.log(r);
      const ca = r.ca;
      // const caHash = crypto.createHash('sha256').update(ca).digest()
      const caHash = cryptoJS.SHA256(ca).toString(cryptoJS.enc.Hex);

      console.log("CaHASH");
      console.log(caHash);

      console.log("Expected Cash")
      console.log(expectedCaHash);

      if (caHash != expectedCaHash) throw new E.CaHashError()

      // const options = {
      //   key: clientCert.key,
      //   cert: clientCert.cert,
      //   ca
      // }
   
      const options = {...initialOptions, headers:{'device-id': deviceId}, body: "{}"};
      //Read boaut fetch POST....do we need to send body?

      console.log("Options");
      console.log({...options, method: 'POST'});

      const query = querystring.stringify({token: hexToken, model})
      //Modiifed http to https (Change it back when not Dev Mode)
      return fetch(`http://${hostname}:${PORT}/pair?${query}`, {...options, method: 'POST'})
        .then(() => {
          const connectionInfo = {
            host: hostname,
            ca
          }

          console.log(connectionInfo);
          console.log(connectionInfoPath);

          return RNFS.writeFile(connectionInfoPath, JSON.stringify(connectionInfo))
        })
    })
   .catch(err => {
     console.log(err);
     throw new Error("Pairing error - Please make sure you have a stable network connection and that you are using the right QR Code")
   })
}

function unpair (connectionInfoPath) {
  RNFS.unlink(connectionInfoPath)
}

function isPaired (connectionInfoPath) {
  return !!connectionInfo(connectionInfoPath)
}

async function connectionInfo (connectionInfoPath) {
  try {

    // return cf;
    console.log("Pairing: Connection Info");
    var info = await RNFS.readFile(connectionInfoPath);
    console.log(info);    
    return JSON.parse(info);
  } catch (e) {
    console.log("Error");
    console.log(e);
    return null
  }
}

async function init (certPath) {
  console.log("Pairing Init");

  const ctf = await selfSign.generate();
  console.log("Ctf");
  console.log(ctf);

  await RNFS.writeFile(certPath.key, ctf.private)
  await RNFS.writeFile(certPath.cert, ctf.cert)

  return {key: ctf.private, cert: ctf.cert};
}

async function getCert(certPath) {
  console.log("Pairing: Get Cert: ", certPath);
  console.log(RNFS.DocumentDirectoryPath);
  // console.log(RNFS.ExternalStorageDirectoryPath);
  try {
    return {
      key: await RNFS.readFile(certPath.key),
      cert: await RNFS.readFile(certPath.cert)
    }
  } catch (e) {
    console.log("Error");
    console.log(e);
    return null
  }
}

module.exports = {init, pair, unpair, isPaired, connectionInfo, getCert}

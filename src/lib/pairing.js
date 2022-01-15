const RNFS = require('react-native-file-access')
const cryptoJS = require('crypto-js')
// const axios = require('axios')
import {fetch as RNSPFetch} from 'react-native-ssl-pinning';
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
  const hostname = '192.168.1.7'; //extractHostname(totem)
  // const hostname = '190.148.209.146';
  // const hostname = extractHostname(totem)
  // const hostname = '127.0.0.1'; 
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

  console.log("ClientCert");
  console.log(clientCert);
  console.log("publicKey");
  console.log(pkb64);

  const initialOptions = {
    // pkPinning: true,
    // sslPinning: {
    //   certs: [`sha1/${pkb64}`]
    // },
    disableAllSecurity: true,
    timeoutInterval: 10000,
  }

  console.log(initialOptions);

  console.log(`http://${hostname}:${PORT}/ca?token=${caHexToken}`);

  console.log("Fetch Definition");
  console.log(RNSPFetch);
  
  //Modified http to https (Change it back when not Dev Mode)
  return RNSPFetch(`http://${hostname}:${PORT}/ca?token=${caHexToken}`, initialOptions)
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
      return RNSPFetch(`http://${hostname}:${PORT}/pair?${query}`, {...options, method: 'POST'})
        .then(() => {
          const connectionInfo = {
            host: hostname,
            ca
          }

          console.log(connectionInfo);
          console.log(connectionInfoPath);

          return RNFS.FileSystem.writeFile(connectionInfoPath, JSON.stringify(connectionInfo))
        })
    })
   .catch(err => {
     console.log(err);
     throw new Error("Pairing error - Please make sure you have a stable network connection and that you are using the right QR Code")
   })
}

function unpair (connectionInfoPath) {
  RNFS.FileSystem.unlink(connectionInfoPath)
}

function isPaired (connectionInfoPath) {
  return !!connectionInfo(connectionInfoPath)
}

async function connectionInfo (connectionInfoPath) {
  try {

    // return cf;
    console.log("Pairing: Connection Info");
    var info = await RNFS.FileSystem.readFile(connectionInfoPath);
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

  try {
    await RNFS.FileSystem.writeFile(certPath.key, ctf.private)
    await RNFS.FileSystem.writeFile(certPath.cert, ctf.cert)
  } catch(err) {
    console.log("Error while WRITING CertFiles");
    console.log(e);
  }

  return {key: ctf.private, cert: ctf.cert};
}

async function getCert(certPath) {
  console.log("Pairing: Get Cert: ", certPath);
  console.log(RNFS.Dirs.DocumentDir);
  // console.log(RNFS.ExternalStorageDirectoryPath);
  try {
    return {
      key: await RNFS.FileSystem.readFile(certPath.key),
      cert: await RNFS.FileSystem.readFile(certPath.cert)
    }
  } catch (e) {
    console.log("Error while READING CertFiles");
    console.log(e);
    return null
  }
}

module.exports = {init, pair, unpair, isPaired, connectionInfo, getCert}

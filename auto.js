const fs = require('fs');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;
const request = require('request');

const getConf = (chain) => {
  const _confLocation = `${process.env.HOME}/.komodo/${chain}/${chain}.conf`;

  if (fs.existsSync(_confLocation)) {
    const _rpcConf = fs.readFileSync(_confLocation, 'utf8');

    if (_rpcConf.length) {
      let _match;
      let parsedRpcConfig = {
        user: '',
        pass: '',
        port: '',
      };

      if (_match = _rpcConf.match(/rpcuser=\s*(.*)/)) {
        parsedRpcConfig.user = _match[1];
      }

      if (_match = _rpcConf.match(/rpcport=\s*(.*)/)) {
        parsedRpcConfig.port = _match[1];
      }

      if (_match = _rpcConf.match(/rpcpassword=\s*(.*)/)) {
        parsedRpcConfig.pass = _match[1];
      }


      return parsedRpcConfig;
    } else {
      shepherd.log(`${_confLocation} is empty`);
    }
  } else {
    shepherd.log(`${_confLocation} doesnt exist`);
  }
}

/*
 *  type: POST
 *  params: payload
 */
 const check = (conf) => {
  const options = {
    url: `http://localhost:${conf.port}`,
    method: 'POST',
    auth: {
      user: conf.user,
      pass: conf.pass,
    },
    body: JSON.stringify({
      agent: 'bitcoinrpc',
      method: 'getinfo',
    }),
  };

  // send back body on both success and error
  // this bit replicates iguana core's behaviour
  request(options, (error, response, body) => {
    if (response &&
        response.statusCode &&
        response.statusCode === 200) {
      res.end(body);
      const getinfo = JSON.parse(body);
      console.log('getinfo');
      console.log(getinfo);
    } else {
      console.log('unable to getinfo');
    }
  });
};

const conf = getConf('VRSC');
console.log(conf);
check(conf);
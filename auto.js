const fs = require('fs');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;
const request = require('request');

const CHECK_TIMEOUT = 240 * 1000;

fs.writeFileSync('auto-log.txt', '', { encoding: 'utf-8', flag: 'w' });

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

const writeLog = (data) => {
  const timeFormatted = new Date(Date.now()).toLocaleString('en-US', { hour12: false });

  console.log(data);
  fs.writeFileSync('auto-log.txt', data + '  ' + timeFormatted + '\n', { encoding: 'utf-8', flag: 'a' });
};

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
      try {
        const getinfo = JSON.parse(body);

      	if (getinfo && getinfo.result && getinfo.result.blocks && Number(getinfo.result.blocks) > 0) {
      		const BLOCKS_DEVIATION_THRESHOLD = 5;

          writeLog('getinfo check');

      		const options = {
        		url: 'https://explorer.veruscoin.io/ext/summary',
        		method: 'GET',
      		};

      		request(options, (error, response, body) => {
        		if (response &&
            			response.statusCode &&
            			response.statusCode === 200) {
          		try {
          			const _parseData = JSON.parse(body).data[0];
                writeLog(`verus remote blockscount: ${_parseData.blockcount}`);

          			if (Math.abs(Number(_parseData.blockcount) - Number(getinfo.result.blocks)) > BLOCKS_DEVIATION_THRESHOLD) {
                  writeLog('needs restart');

                  exec('./verus-cli/komodo-cli -ac_name=VRSC stop');

                  setTimeout(() => {
                    exec('./verus-cli/komodo-cli -ac_name=VRSC stop');
                    writeLog('needs restart, stop attempt 2');
                  }, 5000);
                  setTimeout(() => {
                    exec('./verus-cli/komodo-cli -ac_name=VRSC stop');
                    writeLog('needs restart, stop attempt 3');
                  }, 10000);
                  setTimeout(() => {
                    exec('./verus-cli/komodo-cli -ac_name=VRSC stop');
                    writeLog('needs restart, stop attempt 4');
                  }, 15000);

                  setTimeout(() => {
                    exec('nohup ./verus-cli/start.sh &');
                    writeLog('needs restart, restart attempt 1');

                    setTimeout(() => {
                      exec('nohup ./verus-cli/start.sh &');
                      writeLog('needs restart, restart attempt 2');
                    }, 5000);
                    setTimeout(() => {
                      exec('nohup ./verus-cli/start.sh &');
                      writeLog('needs restart, restart attempt 3');
                    }, 10000);
                    setTimeout(() => {
                      exec('nohup ./verus-cli/start.sh &');
                      writeLog('needs restart, restart attempt 4');
                    }, 15000);
                  }, 20000);
      				  } else {
                  writeLog('block deviation is normal');
      				  }
          		} catch (e) {}
        		}
      	  });
      	} else {
          writeLog('unable to getinfo');
        }
      } catch (e) {
        writeLog('unable to getinfo');
      }
    } else {
      writeLog('unable to getinfo');
  	}
  });
};

const conf = getConf('VRSC');
console.log(conf);

check(conf);
setInterval(() => {
  check(conf);
}, CHECK_TIMEOUT);
const Client = require('ssh2').Client;
const fs = require('fs');
const config = require('./config');

Promise.all(config.map((item, index) => {
  fs.writeFileSync(`miner-${index + 1}.txt`, '', { encoding: 'utf-8', flag: 'w' });

  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      conn.shell((err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          conn.end();
          resolve(true);
        })
        .on('data', (data) => {
          fs.writeFileSync(`miner-${index + 1}.txt`, data + '\n', { encoding: 'utf-8', flag: 'a' });

          // console.log('STDOUT: ' + data);
        })
        .stderr.on('data', (data) => {
          // console.log('STDERR: ' + data);
        });
        stream.end((item.cmd || 'cd verus-cli;./komodo-cli -ac_name=VRSC getinfo') + ';exit\n');
      });
    })
    .connect({
      host: item.host,
      port: item.port,
      username: item.username,
      password: item.password,
    });
  });
}))
.then(promiseResult => {
  let totalHashrate = 0;
  let networkhashps = 0;
  let totalTimeToMine = 0;

  for (let i = 0; i < config.length; i++) {
    const rawData = fs.readFileSync(`miner-${i + 1}.txt`, { encoding: 'utf-8' });
    const split1 = rawData.split(config[i].parse || '{');
    const split2 = split1[1].split('logout');
    split2[0] = '{' + split2[0];
    const blocks = JSON.parse(split2[0].trim())['blocks'];

    console.log(`miner-${i + 1} blocks: ${blocks}`);
  }
});
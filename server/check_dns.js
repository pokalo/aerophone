const dns = require('dns');
dns.resolve4('api.telegram.org', (e, a) => {
  console.log('Node v' + process.version);
  console.log('IPv4:', a, e?.message);
  dns.resolve6('api.telegram.org', (e2, a2) => {
    console.log('IPv6:', a2, e2?.message);
  });
});

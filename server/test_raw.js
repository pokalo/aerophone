const http = require('http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    console.log('METHOD:', req.method, 'URL:', req.url);
    console.log('HEADERS:', JSON.stringify(req.headers));
    console.log('RAW BODY:', JSON.stringify(body));
    console.log('HEX:', Buffer.from(body).toString('hex'));
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({received: body}));
  });
}).listen(3002, () => console.log('Raw body debug server on :3002'));

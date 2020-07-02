const http = require('http');

const hostname = '127.0.0.1';
const port = 31326;

console.log(process.env.ENVIRONMENT || 'e2e');

if (process.env.ENVIRONMENT === 'prod') {	
    process.exit(1);	
}

const server = http.createServer((_, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, jenkins World!2.0\n');
});


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

// const http = require('http');
// const request = require('request');

// const server = http.createServer((req, res) => {
//   if (req.url === '/api/process-audio' && req.method === 'POST') {
//     const proxyReq = request.post('http://localhost:3000/api/process-audio');
//     req.pipe(proxyReq).pipe(res);
//   } else {
//     // Handle your other routes here

//     // Handle not found
//     res.statusCode = 404;
//     res.end('Not Found');
//   }
// });

// server.listen(5000, () => {
//   console.log('Server listening on port 5000');
// });

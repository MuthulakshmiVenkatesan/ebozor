// const { createServer } = require('http');
// const { parse } = require('url');
// const next = require('next');
// const fs = require('fs');
// const path = require('path');
// const dev = process.env.NODE_ENV !== 'production';
// const app = next({ dev });
// const handle = app.getRequestHandler();
// const port = process.env.NODE_PORT || 8003
// app.prepare().then(() => {
//   createServer((req, res) => {
//     const parsedUrl = parse(req.url, true);
//     const { pathname, query } = parsedUrl;
//     if (pathname.startsWith('/.well-known/')) {
//       const filePath = path.join(process.cwd(), pathname.substring(1));
//       try {
//         if (!fs.existsSync(filePath)) {}
//         const fileContent = fs.readFileSync(filePath, 'utf-8');
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(fileContent);
//         return;
//       } catch (error) {
//         console.error(error);
//         res.writeHead(404);
//         res.end('Not Found');
//         return;
//       }
//     }
//     handle(req, res, parsedUrl);
//   }).listen(port, (err) => {
//     if (err) throw err;
//   });
// });

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.NODE_PORT || 8003;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathname.startsWith('/.well-known/')) {
      const filePath = path.join(process.cwd(), pathname.substring(1));

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end();
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(filePath));
      return;
    }

    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

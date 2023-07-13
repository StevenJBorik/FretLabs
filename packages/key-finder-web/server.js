const express = require('express');
const cors = require('cors');
const serveStatic = require('serve-static');

const app = express();
app.use(cors());
app.use(serveStatic('./dist', { index: false }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

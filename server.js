const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const morgan = require('morgan');
const PORT = process.env.PORT || 4001;
const apiRouter = require('./api/api');

const app = express();

/* universal middleware functions */

app.use(bodyParser.json());
app.use(errorhandler());
app.use(cors());
app.use(morgan('dev'));

/* /api routes */

app.use('/api', apiRouter);


/* server listen */

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
});

module.exports = app;
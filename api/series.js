const express = require('express');
const seriesRouter = express.Router();
const issuesRouter = require('./issues');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

/* middleware */

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get(`SELECT * FROM Series WHERE Series.id = ${seriesId}`, (error, row) => {
        if (error) {
            next(error);
        }
        if (row) {
            req.series = row;
            next();
        } else {
            res.status(404).send();
        }
    });
});

seriesRouter.use('/:seriesId/issues', issuesRouter);

const checkRequiredFields = (req, res, next) => {
    if (!req.body.series.name || !req.body.series.description) {
        res.status(400).send();
    } else {
        next();
    }
}


/* GET  */

seriesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Series", (error, rows) => {
        if (error) {
            next(error);
        } else {
            res.status(200).send({series: rows});
        }
    });
});

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).send({series: req.series});
})

/* POST */

seriesRouter.post('/', checkRequiredFields, (req, res, next) => {


    db.run('INSERT INTO Series (name, description) VALUES ($name, $description)', {
        $name: req.body.series.name,
        $description: req.body.series.description
      }, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Series WHERE series.id = ${this.lastID};`, (error, row) => {
                res.status(201).send({series: row})
            });
        };
    });
});

/* PUT */

seriesRouter.put('/:seriesId', checkRequiredFields, (req, res, next) => {


    db.run('UPDATE Series SET name = $name, description = $description WHERE Series.id = $seriesId', {
        $name: req.body.series.name, 
        $description: req.body.series.description, 
        $seriesId: req.params.seriesId
    }, (error) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`, (error, row) => {
                res.status(200).send({series: row});
            });
        }
    });
});

/* DELETE */

seriesRouter.delete('/:seriesId', (req, res, next) => {
    db.get(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            res.status(400).send();
        } else {
            db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`, (error) => {
                if (error) {
                    next(error);
                } else {
                    res.status(204).send();
                }
            })
        }
    })
});


module.exports = seriesRouter;
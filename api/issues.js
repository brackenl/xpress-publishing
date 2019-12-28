const express = require('express');
const issuesRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


/* middleware */

issuesRouter.param('issueId', (req, res, next, issueId) => {
    db.get(`SELECT * FROM Issue WHERE Issue.id = ${issueId}`, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            next();
        } else {
            res.status(404).send();
        }
    });
});

const checkRequiredFields = (req, res, next) => {
    db.get('SELECT * FROM Artist WHERE Artist.id = $artistId', {$artistId: req.body.issue.artistId}, (error, artist) => {
        if (error) {
          next(error);
        } else {
          if (!req.body.issue.name || !req.body.issue.issueNumber || !req.body.issue.publicationDate || !req.body.issue.artistId) {
            return res.sendStatus(400);
          }
        }
        next();
    });
};


/* routes */

issuesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Issue WHERE Issue.series_id = $seriesId;", {$seriesId: req.params.seriesId}, (error, rows) => {
        if (error) {
            next(error);
        } else {
            res.status(200).send({issues: rows});
        }
    });
});


issuesRouter.post('/', (req, res, next) => {

    db.get('SELECT * FROM Artist WHERE Artist.id = $artistId', {$artistId: req.body.issue.artistId}, (error, row) => {
      if (error) {
        next(error);
      } else {
        if (!req.body.issue.name || !req.body.issue.issueNumber || !req.body.issue.publicationDate || !req.body.issue.artistId) {
          return res.status(400).send();
        }
  
        db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)', {
            $name: req.body.issue.name,
            $issueNumber: req.body.issue.issueNumber,
            $publicationDate: req.body.issue.publicationDate,
            $artistId: req.body.issue.artistId,
            $seriesId: req.params.seriesId
          }, function(error) {
          if (error) {
            next(error);
          } else {
            db.get(`SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`,
              (error, row) => {
                res.status(201).send({issue: row});
              });
          }
        });
      }
    });
  });



issuesRouter.put('/:issueId', checkRequiredFields, (req, res, next) => {

    const issue = req.body.issue;

    db.run(`UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId WHERE id = $issueId;`, {
        $name: issue.name, 
        $issueNumber: issue.issueNumber, 
        $publicationDate: issue.publicationDate, 
        $artistId: issue.artistId, 
        $issueId: req.params.issueId
    }, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`, (error, row) => {
                res.status(200).send({issue: row});
            });
        }
    });
});

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run(`DELETE FROM Issue WHERE Issue.id = ${req.params.issueId};`, (error) => {
        if (error) {
            next(error);
        } else {
            res.status(204).send();
        }
    });
});

module.exports = issuesRouter;
const express = require('express');
const artistsRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

/* middleware */

artistsRouter.param('artistId', (req, res, next, artistId) => {
    db.get(`SELECT * FROM Artist WHERE id = ${artistId}`, (error, row) => {
        if (error) {
            next(error);
        }
        if (row) {
            req.artist = row;
            next();
        } else {
            res.status(404).send();
        }
    });
});

const checkRequiredFields = (req, res, next) => {
    const artist = req.body.artist;
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        res.status(400).send();
    } else {
        next();
    }
}

/* '/' routes */

artistsRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Artist WHERE is_currently_employed = 1", (error, rows) => {
        if (error) {
            next(error);
        } else {
            res.status(200).send({artists: rows});
        }
    });
});

artistsRouter.post('/', checkRequiredFields, (req, res, next) => {
    const artist = req.body.artist;
    if (!artist.is_currently_employed) {
        artist.is_currently_employed = 1;
    };
    db.run("INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $is_currently_employed);", {
        $name: artist.name, 
        $dateOfBirth: artist.dateOfBirth, 
        $biography: artist.biography, 
        $is_currently_employed: artist.is_currently_employed
    }, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${this.lastID};`, (error, row) => {
                res.status(201).send({artist: row})
            });
        };
    });
})

/* '/:artistId' routes */

artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).send({artist: req.artist});
})

artistsRouter.put('/:artistId', checkRequiredFields, (req, res, next) => {

    const artist = req.body.artist;

    db.run(`UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId;`, {
        $name: artist.name, 
        $dateOfBirth: artist.dateOfBirth, 
        $biography: artist.biography, 
        $isCurrentlyEmployed: artist.isCurrentlyEmployed, 
        $artistId: req.params.artistId
    }, error => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (error, row) => {
                res.status(200).send({artist: row});
            });
        }
    });
});

artistsRouter.delete('/:artistId', (req, res, next) => {
    db.run(`UPDATE Artist SET is_currently_employed = 0 WHERE id = ${req.params.artistId}`, error => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`, (error, row) => {
                res.status(200).send({artist: row});
            })
        }
    })
})



module.exports = artistsRouter;
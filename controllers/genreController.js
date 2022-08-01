const async = require('async');
const { body, validationResult } = require('express-validator');

const Genre = require('../models/genre');
const Book = require('../models/book');

// Display list of all genres
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort({ name: 1 })
    .exec((err, genres) => {
      if (err) { return next(err); }
      res.render('genre_list', { title: 'Genre List', genre_list: genres });
    });
};

// Display specific genre details
exports.genre_detail = (req, res, next) => {
  async.parallel({
    genre: (callback) => {
      Genre.findById(req.params.id)
        .exec(callback);
    },
    genre_books: (callback) => {
      Book.find({ genre: req.params.id })
        .exec(callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.genre == null) { // No results - Error 404
      const err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    res.render('genre_detail', { ttile: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
  });
};

// Display genre create form GET
exports.genre_create_get = (req, res, next) => {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle genre create form POST
exports.genre_create_post = [
  // Validate and Sanitize data before accepting it
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Handle sanitized request
  (req, res, next) => {
    // Extract validation errors from request
    const errors = validationResult(req);

    // Create new genre object with sanitized data
    const genre = new Genre(
      {
        name: req.body.name,
      },
    );

    if (!errors.isEmpty()) {
      // If there are errors render the form again with sanitized data/error messages
      res.render('genre_form', { title: 'Create Genre', genre: req.body, errors: errors.array() });
    } else {
      // Data is valid
      // Check if Genre of same name already exists
      Genre.findOne({ name: req.body.name })
        .exec((err, found_genre) => {
          if (err) { return next(err); }
          // If a genre with the same name exists redirect to its details page
          if (found_genre) {
            res.redirect(found_genre.url);
          } else {
            // Otherwise save the new genre and redirect to its details page
            genre.save((err) => {
              if (err) { return next(err); }
              res.redirect(genre.url);
            });
          }
        });
    }
  },
];

// Display genre delete form GET
exports.genre_delete_get = (req, res, next) => {
  async.parallel({
    genre: (callback) => {
      Genre.findById(req.params.id, callback);
    },
    books: (callback) => {
      Book.find({ genre: req.params.id }, callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.books });
  });
};

// Handle genre delete form POST
exports.genre_delete_post = (req, res, next) => {
  async.parallel({
    genre: (callback) => {
      Genre.findById(req.body.genreid, callback);
    },
    books: (callback) => {
      Book.find({ genre: req.body.genreid }, callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.books.length > 0) {
      res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.books });
    } else {
      Genre.findByIdAndRemove(req.body.genreid);
      res.redirect('/catalog/genres');
    }
  });
};

// genre Update Form GET
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id, (err, genre) => {
    if (err) { return next(err); }
    if (genre === undefined) {
      const err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    // Success
    res.render('genre_form', { title: 'Update Genre', genre });
  });
};

// genre Update Form POST
exports.genre_update_post = [
  // Validate and sanitize the name field.
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    const genre = new Genre(
      {
        name: req.body.name,
        _id: req.params.id,
      },
    );

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { ttile: 'Update Genre', genre, errors: errors.array() });
      return;
    } else {
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
        if (err) { return next(err); }
        // Genre updated. Redirect to genre detail page.
        res.redirect(thegenre.url);
      });
    }
  },
];

const async = require('async');
const { body, validationResult } = require('express-validator');

// Import necessary models
const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

// GET catalog home page
exports.index = (req, res, next) => {
  async.parallel({
    book_count: (callback) => {
      Book.countDocuments({}, callback);
    },
    bookinstance_count: (callback) => {
      BookInstance.countDocuments({}, callback);
    },
    bookinstance_available_count: (callback) => {
      BookInstance.countDocuments({ status: 'Available' }, callback);
    },
    author_count: (callback) => {
      Author.countDocuments({}, callback);
    },
    genre_count: (callback) => {
      Genre.countDocuments({}, callback);
    },
  }, (err, results) => {
    res.render('index', { title: 'Library Home', error: err, data: results });
  });
};

// Display list of all books
exports.book_list = (req, res, next) => {
  Book.find({}, 'title author')
    .sort({ title: 1 })
    .populate('author')
    .exec((err, books) => {
      if (err) { return next(err); }
      res.render('book_list', { title: 'Book List', book_list: books });
    });
};

// Display specific book details
exports.book_detail = (req, res, next) => {
  async.parallel({
    book: (callback) => {
      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },
    instances: (callback) => {
      BookInstance.find({ book: req.params.id })
        .exec(callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.book == null) {
      const err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }
    res.render('book_detail', { title: 'Book Detail', book: results.book, book_instances: results.instances });
  });
};

// Display book create form GET
exports.book_create_get = (req, res, next) => {
  // Get all authors and genres, which we can use for adding to our book
  async.parallel({
    authors: (callback) => {
      Author.find()
        .exec(callback);
    },
    genres: (callback) => {
      Genre.find()
        .exec(callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    res.render('book_form', { title: 'Create book', authors: results.authors, genres: results.genres });
  });
};

// Handle book create form POST
exports.book_create_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!(Array.isArray(req.body.genre))) {
      if (typeof req.body.genre === 'undefined') {
        req.body.genre = [];
      } else {
        req.body.genre = [req.body.genre];
      }
    }
    next();
  },

  // Validate and sanitize fields
  body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  // Process request after validatiion
  (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book(
      {
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: req.body.genre,
      },
    );

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages

      // Get all authors and genres for form.
      async.parallel({
        authors: (callback) => {
          Author.find()
            .exec(callback);
        },
        genres: (callback) => {
          Genre.find()
            .exec(callback);
        },
      }, (err, results) => {
        if (err) { return next(err); }

        // Mark our selected genres as checked
        for (let i = 0; i < results.genres.length; i++) {
          if (book.genre.indexOf(results.genres[i]._id) > -1) {
            results.genres[i].checked = 'true';
          }
        }
        res.render('book_form', {
          title: 'Create Book', authors: results.authors, genres: results.genres, book: req.body, errors: errors.array(),
        });
      });
      return;
    } else {
      // Data from form is valid. Save book
      book.save((err) => {
        if (err) { return next(err); }
        res.redirect(book.url);
      });
    }
  },
];

// Display book delete form GET
exports.book_delete_get = (req, res, next) => {
  async.parallel({
    book: (callback) => {
      Book.findById(req.params.id, callback);
    },
    instances: (callback) => {
      BookInstance.find({ book: req.params.id }, callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    res.render('book_delete', { title: 'Delete Book', book: results.book, bookinstance: results.instances });
  });
};

// Handle book delete form POST
exports.book_delete_post = (req, res, next) => {
  async.parallel({
    book: (callback) => {
      Book.findById(req.body.bookid, callback);
    },
    instances: (callback) => {
      BookInstance.find({ book: req.body.bookid }, callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.instances.length > 0) {
      // Book has instances. render same as Get
      res.render('book_delete', { title: 'Delete Book', book: results.book, bookinstance: results.instances });
    } else {
      Book.findByIdAndRemove(req.body.bookid);
      res.redirect('/catalog/books');
    }
  });
};

// book Update Form GET
exports.book_update_get = (req, res, next) => {
  async.parallel({
    book: (callback) => {
      Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
    },
    authors: (callback) => {
      Author.find(callback);
    },
    genres: (callback) => {
      Genre.find(callback);
    },

  }, (err, results) => {
    if (err) { return next(err); }
    if (results.book == null) { // No results.
      const err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }
    // Success.
    // Mark our selected genres as checked.
    // all_g_iter === all_genre_iterations
    // book_g_iter === book_genre_iterations
    for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
      for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
        if (results.genres[all_g_iter]._id.toString() === results.book.genre[book_g_iter]._id.toString()) {
          results.genres[all_g_iter].checked = true;
        }
      }
    }
    res.render('book_form', {
      title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book,
    });
  });
};

// book Update Form POST
exports.book_update_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!(Array.isArray(req.body.genre))) {
      if (typeof req.body.genre === 'undefined') {
        req.body.genre = [];
      } else {
        req.body.genre = [req.body.genre];
      }
    }
    next();
  },

  // Validate and sanitize fields.
  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book(
      {
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
        _id: req.params.id, // This is required, or a new ID will be assigned!
      },
    );

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      async.parallel({
        book: (callback) => {
          Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: (callback) => {
          Author.find(callback);
        },
        genres: (callback) => {
          Genre.find(callback);
        },

      }, (err, results) => {
        if (err) { return next(err); }
        if (results.book == null) { // No results.
          const err = new Error('Book not found');
          err.status = 404;
          return next(err);
        }
        // Success.
        // Mark our selected genres as checked.
        // all_g_iter === all_genre_iterations
        // book_g_iter === book_genre_iterations
        for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
          for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
            if (results.genres[all_g_iter]._id.toString() === results.book.genre[book_g_iter]._id.toString()) {
              results.genres[all_g_iter].checked = true;
            }
          }
        }
        res.render('book_form', {
          title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book, errors: errors.array(),
        });
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
        if (err) { return next(err); }
        // Successful - redirect to book detail page.
        res.redirect(thebook.url);
      });
    }
  },
];

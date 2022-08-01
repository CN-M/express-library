const async = require('async');
const { body, validationResult } = require('express-validator');

const BookInstance = require('../models/bookinstance');
const Genre = require('../models/genre');
const Book = require('../models/book');
const bookinstance = require('../models/bookinstance');

// Display list of all bookinstances
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find()
    .populate('book')
    .exec((err, instances) => {
      if (err) { return next(err); }
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: instances });
    });
};

// Display specific bookinstance details
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, instance) => {
      if (err) { return next(err); }
      if (instance == null) {
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance_detail', { title: `Copy ${instance.book.title}`, bookinstance: instance });
    });
};

// Display bookinstance create form GET
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, 'title')
    .exec((err, books) => {
      if (err) { return next(err); }
      res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
    });
};

// Handle bookinstance create form POST
exports.bookinstance_create_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  (req, res, next) => {
    const errors = validationResult(req);
    const instance = new BookInstance(
      {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
      },
    );

    if (!errors.isEmpty()) {
      Book.find()
        .exec((err, books) => {
          if (err) { return next(err); }
          res.render('bookinstance_form', {
            title: 'Create BookInstance', book_List: books, selected_book: instance.book._id, errors: errors.array(), bookinstance: instance,
          });
        });
      return;
    } else {
      instance.save((err) => {
        if (err) { return next(err); }
        res.redirect(instance.url);
      });
    }
  },
];

// Display bookinstance delete form GET
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id, (err, instance) => {
    if (err) { return next(err); }
    res.render('bookinstance_delete', { title: 'Delete Instance', instance });
  });
};

// Handle bookinstance delete form POST
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndRemove(req.body.instanceid, (err) => {
    if (err) { return next(err); }
    res.redirect('/catalog/bookinstances');
  });
};

// bookinstance Update Form GET
exports.bookinstance_update_get = (req, res, next) => {
  // Get book, authors and genres for form.
  async.parallel({
    bookinstance: (callback) => {
      BookInstance.findById(req.params.id).populate('book').exec(callback);
    },
    books: (callback) => {
      Book.find(callback);
    },

  }, (err, results) => {
    if (err) { return next(err); }
    if (results.bookinstance === null) {
      const err = new Error('Book copy not found');
      err.status = 400;
      return next(err);
    }
    // Success
    res.render('bookinstance_form', {
      title: 'Update Book Instance',
      book_list: results.books,
      selected_book: results.bookinstance.book._id,
      bookinstance: results.bookinstance,
    });
  });
};

// bookinstance Update Form POST
exports.bookinstance_update_post = [

  // Validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance(
      {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id,
      },
    );

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title')
        .exec((err, books) => {
          if (err) { return next(err); }
          // Successful, so render.
          res.render('bookinstance_form', {
            title: 'Update Book Instance',
            book_list: books,
            selected_book: bookinstance.book._id,
            errors: errors.array(),
            bookinstance,
          });
        });
      return;
    } else {
      // Data from form is valid.
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, (err, thebookinstance) => {
        if (err) { return next(err); }
        // Successful - redirect to new record.
        res.redirect(thebookinstance.url);
      });
    }
  },
];

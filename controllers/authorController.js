/* eslint-disable prefer-arrow-callback */
const async = require('async');
const { body, validationResult } = require('express-validator');

const Author = require('../models/author');
const Book = require('../models/book');

// Display list of all Authors
exports.author_list = (req, res, next) => {
  Author.find()
    .sort([['family_name', 'ascending']])
    .exec((err, authors) => {
      if (err) { return next(err); }
      res.render('author_list', { title: 'Author List', author_list: authors });
    });
};

// Display specific Author details
exports.author_detail = (req, res, next) => {
  async.parallel({
    author: (callback) => {
      Author.findById(req.params.id)
        .exec(callback);
    },
    books: (callback) => {
      Book.find({ author: req.params.id }, 'title summary')
        .exec(callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.author == null) {
      const err = new Error('Author not found');
      err.status = 404;
      return next(err);
    }
    res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.books });
  });
};

// Display Author create form GET
exports.author_create_get = (req, res, next) => {
  res.render('author_form', { title: 'Create Author' });
};

// Handle Author create form POST
exports.author_create_post = [
  body('first_name').trim().isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters'),
  body('family_name').trim().isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);
    const author = new Author(
      {
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      },
    );

    if (!errors.isEmpty()) {
      res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
    } else {
      Author.findOne({ first_name: req.body.first_name, family_name: req.body.family_name })
        .exec((err, found_author) => {
          if (err) { return next(err); }
          if (found_author) {
            res.redirect(found_author.url);
          } else {
            author.save((err) => {
              if (err) { return next(err); }
              res.redirect(author.url);
            });
          }
        });
    }
  },
];

// Display Author delete form GET
exports.author_delete_get = (req, res, next) => {
  async.parallel({
    author: (callback) => {
      Author.findById(req.params.id, callback);
    },
    books: (callback) => {
      Book.find({ author: req.params.id }, callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.author == null) {
      res.redirect('/catalog/authors');
    }
    res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.books });
  });
};

// Handle Author delete form POST
exports.author_delete_post = (req, res, next) => {
  async.parallel({
    author: (callback) => {
      Author.findById(req.body.authorid, callback);
    },
    books: (callback) => {
      Book.find({ author: req.body.authorid }, callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.books.length > 0) {
      // Author has books. Render in same way as GET
      res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.books });
      return;
    } else {
      // Author has no books. Delete object and redirect to author list
      Author.findByIdAndRemove(req.body.authorid, (err) => {
        if (err) { return next(err); }
        res.redirect('/catalog/authors');
      });
    }
  });
};

// Author Update Form Get
exports.author_update_get = (req, res, next) => {
  // Get Author for form.
  Author.findById(req.params.id, (err, author) => {
    if (err) { return next(err); }
    if (author == null) { // No results
      const err = new Error('Author not found');
      err.status = 404;
      return next(err);
    }
    // Success
    res.render('author_form', { title: 'Update Author', author });
  });
};

// Author Update Form Put
exports.author_update_post = [

  // Validate and sanitize fields.
  body('first_name').trim().isLength({ min: 1 }).escape()
    .withMessage('First name must be specified!')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('family_name').trim().isLength({ min: 1 }).escape()
    .withMessage('Family name must be specified!')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    const author = new Author(
      {
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id,
      },
    );

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('author_form', { title: 'Update Author', author, errors: errors.array() });
      return;
    } else {
      // Data from form is valid. Update the record.
      Author.findByIdAndUpdate(req.params.id, author, {}, (err, theauthor) => {
        if (err) { return next(err); }
        // Successful - redirect to genre detail page.
        res.redirect(theauthor.url);
      });
    }
  },
];

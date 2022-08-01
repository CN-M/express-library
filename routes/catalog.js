const express = require('express');

const router = express.Router();

// Require controller modules
const authorController = require('../controllers/authorController');
const bookController = require('../controllers/bookController');
const genreController = require('../controllers/genreController');
const bookinstanceController = require('../controllers/bookinstanceController');

// BOOK ROUTES //

// GET request for Site Home page
router.get('/', bookController.index);

// GET request to create book // Must come before anything that uses ID
router.get('/book/create', bookController.book_create_get);

// POST request create book
router.post('/book/create', bookController.book_create_post);

// GET request to display all books
router.get('/books', bookController.book_list);

// GET request to display details of specific book
router.get('/book/:id', bookController.book_detail);

// GET request to delete book
router.get('/book/:id/delete', bookController.book_delete_get);

// POST request to delete book
router.post('/book/:id/delete', bookController.book_delete_post);

// GET request update book
router.get('/book/:id/update', bookController.book_update_get);

// POST request to update book
router.post('/book/:id/update', bookController.book_update_post);

// AUTHOR ROUTES //

// GET request create author // Must come before anything that uses ID
router.get('/author/create', authorController.author_create_get);

// POST request create author
router.post('/author/create', authorController.author_create_post);

// GET request to display all authors
router.get('/authors', authorController.author_list);

// GET request to display details of specific author
router.get('/author/:id', authorController.author_detail);

// GET request to delete author
router.get('/author/:id/delete', authorController.author_delete_get);

// POST request to delete author
router.post('/author/:id/delete', authorController.author_delete_post);

// GET request update author
router.get('/author/:id/update', authorController.author_update_get);

// POST request to update author
router.post('/author/:id/update', authorController.author_update_post);

// GENRE ROUTES //

// GET request create genre // Must come before anything that uses ID
router.get('/genre/create', genreController.genre_create_get);

// POST request create genre
router.post('/genre/create', genreController.genre_create_post);

// GET request to display all genres
router.get('/genres', genreController.genre_list);

// GET request to display details of specific genre
router.get('/genre/:id', genreController.genre_detail);

// GET request to delete genre
router.get('/genre/:id/delete', genreController.genre_delete_get);

// POST request to delete genre
router.post('/genre/:id/delete', genreController.genre_delete_post);

// GET request update genre
router.get('/genre/:id/update', genreController.genre_update_get);

// POST request to update genre
router.post('/genre/:id/update', genreController.genre_update_post);

// BOOKINSTANCE ROUTES //

// GET request create bookinstance // Must come before anything that uses ID
router.get('/bookinstance/create', bookinstanceController.bookinstance_create_get);

// POST request create bookinstance
router.post('/bookinstance/create', bookinstanceController.bookinstance_create_post);

// GET request to display all bookinstances
router.get('/bookinstances', bookinstanceController.bookinstance_list);

// GET request to display details of specific bookinstance
router.get('/bookinstance/:id', bookinstanceController.bookinstance_detail);

// GET request to delete bookinstance
router.get('/bookinstance/:id/delete', bookinstanceController.bookinstance_delete_get);

// POST request to delete bookinstance
router.post('/bookinstance/:id/delete', bookinstanceController.bookinstance_delete_post);

// GET request update bookinstance
router.get('/bookinstance/:id/update', bookinstanceController.bookinstance_update_get);

// POST request to update bookinstance
router.post('/bookinstance/:id/update', bookinstanceController.bookinstance_update_post);

module.exports = router;

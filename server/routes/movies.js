const express = require('express');
const requireLogin = require('../middleware/auth');
const movieController = require('../controllers/movieController');

const router = express.Router();

router.get('/admin/movie/movie-management', requireLogin, movieController.getMovieManagement);
router.get('/admin/movie/movie-management/create', requireLogin, movieController.getMovieCreate);
router.post('/admin/movie/movie-management/create', requireLogin, movieController.postMovieCreate);
router.post('/admin/movie/movie-management/:id/delete', requireLogin, movieController.postMovieDelete);
router.get('/admin/movie/movie-management/:id/edit', requireLogin, movieController.getMovieEdit);
router.post('/admin/movie/movie-management/:id/edit', requireLogin, movieController.postMovieEdit);
router.get('/admin/movie/movie-management/:id/view', requireLogin, movieController.getMovieView);

module.exports = router;
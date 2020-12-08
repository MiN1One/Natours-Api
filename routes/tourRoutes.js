const express = require('express');
const controller = require('../controllers/tourController');
const authController = require('../controllers/authController');

// ****************************************


// *********************************************

const router = express.Router();

// router.param('id', controller.checkId);

router
    .route('/tour-stats')
    .get(controller.getTourStats);

router
    .route('/monthly-plan/:year')
    .get(controller.getMonthlyPlan);

router
    .route('/')
    .get(authController.protect, controller.getAllTours)
    .post(controller.createATour);

router
    .route('/top-5-best')
    .get(controller.aliasTopTours, controller.getAllTours);

router
    .route('/:id')
    .get(controller.getATour)
    .post(controller.createATour)
    .delete(authController.protect, authController.restrictTo(['admin', 'lead-guide']), controller.deleteATour)
    .patch(controller.updateATour);

module.exports = router;
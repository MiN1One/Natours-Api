const express = require('express');
const controller = require('../controllers/userController');
const authController = require('../controllers/authController');

// *********************************************



// *********************************************

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword); 
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch('/updatePassword', authController.protect, authController.updatePassword);

router.patch('/updateMe', authController.protect, controller.updateMe);

router.delete('/deleteMe', authController.protect, controller.deleteMe);

router
    .route('/')
    .get(controller.getAllUsers)
    .post(controller.createAUser);

router
    .route('/:id')
    .get(controller.getAUser)
    .delete(controller.deleteAUser)
    .patch(controller.updateAUser);

module.exports = router;
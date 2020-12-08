const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErrors');

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    // Replaced by query middleware
    // const users = await User.find({ active: {$ne: false} });
    
    // const users = await Tour.find().where('duration').equals(5).where('diffculty').equals('easy');
    
    // ############### SENDIND RES ###############
    res.status(200).json({
        status: 'success',
        time: req.requestTime,
        results: users.length,
        data: {
            users
        }
    });
});

exports.getAUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet implemented'
    });
};

exports.createAUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet implemented'
    });
};

exports.deleteAUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet implemented'
    });
};

exports.updateAUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet implemented'
    });
};

exports.updateMe = (req, res, next) => {
    // 1. Create error if user wants to update password
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('Do not even try to hack the server. #/*$&*'), 400)
    }

    // 2. Update user document
    res.status(200).json({
        status: 'success',
    })
};

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});
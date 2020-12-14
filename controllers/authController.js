const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErrors');
const sendEmail = require('../utils/email');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRESIN
    })
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000),
        secure: true,
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'development') cookieOptions.secure = undefined;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token
    });
};

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        password: req.body.password,
        email: req.body.email,
        passwordConfirm: req.body.passwordConfirm,
        photo: req.body.photo
    });

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1. Check if email and password actually exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // 2. Check if the user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.checkPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3. If everything is okay, send token to client
    createSendToken(user, 201, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1. Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in!', 401));
    }

    console.log(token);

    // 2. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);

    // 3. Check if the user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user for this token does no longer exist', 401));
    }

    // 4. Check if user changed password after JWT token was issued
    // TRUE means password was changed
    if (currentUser.wasPasswordChanged(decoded.iat)) {
        return next(new AppError('User recently changed password! Please login again.', 401))
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
});

exports.restrictTo = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    }
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with the email address'), 404);
    }

    // 2. Generate random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3. Send it back as an email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}`;

    try {
        sendEmail({
            email: user.email,
            subject: 'Password reset link (10 min)',
            message
        });
    } catch {
        return next(new AppError('Server internal error', 500));
    }

    next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
        
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordExpires: { $gt: Date.now() }
    });

    // 2. If the token is not expired, set new password
    if (!user) {
        return next(new AppError('Reset token has expired or invalid', 400))
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordExpires = undefined;
    await user.save();
    
    // 3. Update passwordChangedAt property for the user
    // user.passwordChangedAt = Date.now();

    // 4. Log the user in, send JWT
    createSendToken(user, 200, res);
    
    next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1. Get user from the collection 
    const user = await User.findById(req.user.id).select('+password');

    // 2. Check if POST password is correct
    if (!(await user.checkPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Incorrect password!'), 401);
    }

    // 3. If password is correct, update the password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4. Log user in, send JWT
    createSendToken(user, 200, res);
});
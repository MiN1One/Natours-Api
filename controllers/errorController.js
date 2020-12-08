const AppError = require('../utils/appErrors');

const handleDuplicateFieldsDB = (err) => {
    // const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/[0]);
    // console.log(value);
    const message = `Duplicate field value. Please use another value`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please login again!', 403);

const handleJWTExpired = () => new AppError('Your token has expired.', 401);

const handleValidationErrorDB = () => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data ${errors.join('; ')}`;
    return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
    const message = 'Invalid ' + err.path + ': ' + err.value;
    return new AppError(message, 400);
};

const sendErrorForDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorForProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.error('ERROR', err);

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};

// numArgs = 4, [0] = errorObj
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorForDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
        else if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        else if (error.errors) error = handleValidationErrorDB();
        else if (error.name === 'TokenExpiredError') error = handleJWTExpired();
        else sendErrorForProd(error, res);
    }
};
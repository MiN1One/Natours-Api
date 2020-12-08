const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

const AppError = require('./utils/appErrors');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');

// ##########################################
//              GLOBAL MIDDLEWARES
// ##########################################

// Security HTTP Headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
};

// Limit requests from same IP Address
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from your IP, please try again in an hour!'
});
app.use('/api', limiter);

// Origin cors policy
app.use(cors());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

// Serving static files
app.use(express.static(__dirname + '/public'));

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// ##########################################
//                  ROUTES
// ##########################################

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getATour);
// app.post('/api/v1/tours', createATour);
// app.patch('/api/v1/tours/:id', updateATour);
// app.delete('/api/v1/tours/:id', deleteATour);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
    // const err = new Error('Not found! ' + req.originalUrl);
    // err.status = 'hehe error';
    // err.statusCode = 404;
    
    next(new AppError('Not found! Error!' + req.originalUrl, 404));
});

app.use(globalErrorHandler);

module.exports = app;
const Tour = require('./../models/tourModel');

const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErrors');

// const tours = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../dev-data/data/tours-simple.json'), 'UTF-8'));

exports.aliasTopTours = (req, res, next) => {
    req.query.sort = '-ratingsAverage,price',
    req.query.limit = '5',
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
    // ############### FILTERING ###############

    // 1) Filtering
    // const queryObj = { ...req.query };
    // const excludedFields= ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);

    // console.log(req.query);
    // console.log(queryObj);

    // 2) Advanced Filtering

    // operators*
    // gte, gt, lte, lt

    // e.g. { difficulty: 'easy', duration: { $gte: 5 } }
    // e.g. queryObj = { difficulty: 'easy', duration: { gte: 5 } }
    
    // ############### ADVANCED FILTERING ###############

    // let queryStr = JSON.stringify(queryObj);
    // console.log(queryStr);
    // queryStr = queryStr.replace(/\b{gte|gt|lte|lt}\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr));

    // let query = Tour.find(JSON.parse(queryStr));
    
    // ############## SORTING ################
    // if (req.query.sort) {
    //     const sortByMany = req.query.sort.split(',').join(' ');
    //     query = query.sort(sortByMany);
    // } else {
    //     query = query.sort('-createdAt');
    // };
    
    // ############## FIELD LIMITING ################
    // if (req.query.fields) {
    //     const fields = req.query.fields.split(',').join(' ');
    //     query = query.select(fields);
    // } else {
    //     query = query.select('-__v');
    // }

    // ############### PAGINATION ###############
    // const numTours = await Tour.countDocuments();
    // const page = +req.query.page;
    // const limit = +req.query.limit;
    // const skip = (page - 1) * limit;
    // if (numTours <= skip) throw new Error('The requested page does not exist') 
    // else query = query.skip(skip).limit(limit);

    // ############### EXECUTE QUERY ###############
    const features = 
        new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const tours = await features.query;
    
    // const tours = await Tour.find().where('duration').equals(5).where('diffculty').equals('easy');
    
    // ############### SENDIND RES ###############
    res.status(200).json({
        status: 'success',
        time: req.requestTime,
        results: tours.length,
        data: {
            tours
        }
    });
});

exports.getATour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findById(req.params.id);

    if (!tour) {
        return next(new AppError('No tour found with the ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});

exports.createATour = catchAsync(async (req, res, next) => {
    // ## 1
    // const newTour = new Tour({});
    // newTour.save().then()

    // ## 2
    const newTour = await Tour.create(req.body);
    
    res.status(201).json({ 
        status: 'success',
        data: {
            tour: newTour
        }
    });
    // const newId = tours[tours.length - 1].id + 1;
    // const newTour = Object.assign({id: newId}, req.body);
    // console.log(newTour);
    
    // tours.push(newTour);

    // fs.writeFile(
    //     path.resolve(__dirname, '../dev-data/data/tours-simple.json'),
    //     JSON.stringify(tours),
    //     err => {
    //         res.status(201).json({ 
    //             status: 'success',
    //             data: {
    //                 tour: newTour
    //             }
    //     })
    // })
});

exports.updateATour = catchAsync(async (req, res, next) => {
    // const updatedTour = await Tour.updateOne({ _id: req.params.id });
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, { 
        new: true,
        runValidators: true
    });

    if (!updatedTour) {
        return next(new AppError('No tour found with the ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour: updatedTour
        }
    })
});

exports.deleteATour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
        return next(new AppError('No tour found with the ID', 404));
    }

    res.status(204);
});

// exports.checkId = (req, res, next, val) => {
//     if (+val > tours.length - 1) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid id'
//         })
//     };
//     console.log('Tour id is ' + val);
//     next();
// };

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: { $lt: 5} }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                numRatings: { $sum: '$ratingsQuantity' },
                numTours: { $sum: 1 }
            }
        },
        {
            $sort: { avgPrice: 1 } 
        }
        // {
        //     $match: { _id: { $ne: 'EASY' } }
        // }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    console.log(req.params)
    const year = +req.params.year; // 2021

    const plans = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTours: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        {
            $project: {
                _id: 0, // id will not be included
            }
        },
        {
            $sort: {
                numTours: -1
            }
        }
    ]);

    res.status(200).json({
        stats: 'success',
        data: {
            plans
        }
    });
});


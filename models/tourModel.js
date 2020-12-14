const mogoose = require('mongoose');
const slugify = require('slugify');
// const validatorjs = require('validator');
const User = require('./userModel');

const tourSchema = new mogoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name must have less than or equal 40 characters'],
      minlength: [5, 'A tour name must have more than or equal 5 characters']
      // validate: [validatorjs.isAlpha, 'Tour name cannot contain numbers']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'meidum', 'difficult', 'hardcore'],
        message: 'Invalid difficulty string'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount price ({VALUE}) should be below the regular price',
        validator: function(val) {
          return val <= this.price;
        }
      }
    },
    discount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      required: [true, 'A tour must have a imagename'],
      type: String
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: Array
  }, {
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    }
  );
  
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// "pre" method runs before an action
// "post" method runs after an action has finished

// DOCUMENT MIDDLEWARE: runs before .save() and .create(), not insertComs
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', function(next) {
  // const guides = this.guides.map(el => 
  next();
});


// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
  // tourSchema.pre('find', function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
  console.log(this);
  next();
});

// MODEL MIDDLEWARE
const Tour = mogoose.model('Tour', tourSchema);

module.exports = Tour;

// 4 types of Mongoose middlewares
/*
DOCUMENT
QUERY
MODEL 
AGGREGATE
*/
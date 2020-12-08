const fs = require('fs');
const dotenv = require('dotenv');
const mogoose = require('mongoose');
const Tour = require('./../../models/tourModel');

dotenv.config({ path: '../../config.env' });

const DB = process.env.DB.replace(
  '<PASSWORD>', 
  process.env.DB_PASSWORD
);

mogoose
  .connect(DB, {
    // ##LOCAL DB
    // .connect(process.env.DB_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(connection => {
    // console.log(mogoose.connections);
    console.log('DB connection successful');
  });

// READ JSON
const tours = JSON.parse(fs.readFileSync('tours-simple.json', 'utf-8'));

// IMPORT DATA INTO DB
const importData = async () => {
    try {
        await Tour.create(tours);
        console.log('LOADED DATA!!!!!');
    } catch (err) {
        console.log(err);
    }
};

// DELETE ALL DATA FROM COLLECTION 
const deleteData = async () => {
    try {
        await Tour.deleteMany({});
        console.log('DELETED DATA!!!!!')
    } catch (err) {
        console.log(err);
    }
};

if (process.argv[2] === '--import') {
    importData();
    process.exit();
} else if (process.argv[2] === '--delete') {
    deleteData();
    process.exit();
}

// console.log(process.argv);
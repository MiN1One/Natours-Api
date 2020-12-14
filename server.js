const dotenv = require('dotenv');
const mogoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION!');
  console.log(err.name, err.message);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

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

const port = process.env.PORT || 3500;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  // console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});


mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: true,
    });

    console.log('DB connection has been established.');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
const path = require('path');
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const colors = require('colors');
const  cors = require("cors");
// const admin = require("firebase-admin");
// const serviceAccount = require("./feroshgah.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
// Load env variables
dotenv.config({ path: './config/config.env' });


// Connect to database
connectDB();

// Route files
const hostels = require('./routes/hostels');
const rooms = require('./routes/rooms');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');
const shopReviews = require('./routes/shopReview');
const shops = require('./routes/shops');
const products = require('./routes/products');
const jobs = require('./routes/jobs');
const braintree = require('./routes/braintree');

//app.use(bodyParser.urlencoded({ extended: false }));

// Body parser
app.use(express.json());
app.use(cors());

// Cookie parser
app.use(cookieParser());

// Set static folder
//app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/hostels', hostels);
app.use('/api/v1/rooms', rooms);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);
app.use('/api/v1/shops', shops);
app.use('/api/v1/products', products);
app.use('/api/v1/shop-review', shopReviews);
app.use('/api/v1/jobs', jobs);
app.use('/api/v1/braintree', braintree);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(
  PORT,
  console.log(
    `Server is listening in ${process.env.NODE_ENV} on port ${PORT}`.yellow.bold
  )
);

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server and exit process
  server.close(() => process.exit(1));
});

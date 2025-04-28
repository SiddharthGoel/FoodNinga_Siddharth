// server.js

import express from 'express';
import cors from 'cors';
import sql from 'mssql'; // <-- important for Windows Auth
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import zipcodes from 'zipcodes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Middleware
app.use(bodyParser.json());

// SQL Server Config for Windows Authentication
const sqlConfig = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    server: process.env.SQL_SERVER,
    port: 1433, // default for SQL Server
    options: {
        encrypt: true, // AWS RDS requires encryption
        trustServerCertificate: true // also needed for AWS RDS
    }
};

// MongoDB Config
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Mongo Schemas
const MenuSchema = new mongoose.Schema({
    restaurant_id: Number,
    category: String,
    name: String,
    description: String,
    price: String
});
const restaurantSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  position: {
    type: Number
  },
  name: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: null
  },
  ratings: {
    type: Number,
    default: 0
  },
  category: {
    type: String
  },
  price_range: {
    type: String
  },
  full_address: {
    type: String
  },
  zip_code: {
    type: Number
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
});
// Define the RatingReview Schema
const ratingReviewSchema = new mongoose.Schema({
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant', // Assuming a Restaurant model exists
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming a User model exists
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  review: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const LogSchema = new mongoose.Schema({
    log_id: mongoose.Schema.Types.ObjectId,
    event_type: String,
    user_id: Number,
    timestamp: Date
});

const Menu = mongoose.model('Menu', MenuSchema);
const RatingReview = mongoose.model('RatingReview', ratingReviewSchema);
const Log = mongoose.model('Log', LogSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Test Connection Route
app.get('/ping', async (req, res) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request().query('SELECT TOP 1 * FROM Restaurants');
        res.json({ message: 'SQL + Mongo Connected', sqlSample: result.recordset[0] });
    } catch (err) {
        console.error('SQL Server Connection Error:', err);
        res.status(500).json({ error: 'Failed connecting to SQL Server', details: err.message });
    }
});

// Routes

// Get all restaurants
app.get('/restaurants', async (req, res) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request().query('SELECT TOP 100 * FROM Restaurants');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching restaurants:', err);
        res.status(500).send(err.message);
    }
});

// Get menu by restaurant id
app.get('/menus/:restaurantId', async (req, res) => {
  try {
      const restaurantId = parseInt(req.params.restaurantId);
      const menus = await Menu.find({ restaurant_id: restaurantId });
      res.json(menus);
  } catch (err) {
      console.error('Error fetching menus:', err);
      res.status(500).send(err.message);
  }
});
// app.get('/restaurants/:zipCode', async (req, res) => {
//     try {
//         const pool = await sql.connect(sqlConfig);
//         const zipCode = `%${req.params.zipCode}%`;
//         console.log(zipCode)
//         const result = await pool.request()
//             .input('zipCode', sql.VarChar, zipCode)
//             .query('SELECT * FROM Restaurants WHERE zip_code LIKE @zipCode');
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('Error fetching restaurants:', err);
//         res.status(500).send(err.message);
//     }
// });
app.get('/restaurants/:zipCode', async (req, res) => {
  const zipCode = req.params.zipCode;  // Just use as-is
  if (!zipCode) {
    return res.status(400).json({ error: "Zipcode is required" });
  }
  const location = zipcodes.lookup(zipCode);

  if (!location) {
    return res.status(404).json({ error: "Invalid zipcode" });
  }

  const { latitude, longitude } = location;
  console.log(zipCode, latitude, longitude);
  try {
    // Radius of Earth ≈ 3963.2 miles
    const restaurantsNearby = await Restaurant.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],
            10 / 3963.2 // 10 miles in radians
          ]
        }
      }
    }); // No .toArray() needed

    res.json(restaurantsNearby);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const pool = await sql.connect(sqlConfig);

    // Check if email already exists
    const checkResult = await pool
      .request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await pool
      .request()
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('phone', sql.VarChar, phone)
      .query(
        'INSERT INTO Users (name, email, password, phone) VALUES (@name, @email, @password, @phone)'
      );

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect(sqlConfig);

    // Find user by email
    const userResult = await pool
      .request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.recordset[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user_id: user.user_id, name: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/orders', async (req, res) => {
  // console.log(req.body);
  const { user_id, restaurant_id, orders, total_price, status, timestamps } = req.body;

  if (!user_id || !restaurant_id || !orders || orders.length === 0) {
    return res.status(400).json({ error: 'Missing required order fields.' });
  }

  const pool = await sql.connect(sqlConfig);

  try {
    // Step 1: Insert into Orders table and capture the generated order_id
    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('restaurant_id', sql.Int, restaurant_id)
      .input('total_price', sql.Decimal(10, 2), total_price)
      .input('status', sql.VarChar(50), status)
      .input('timestamps', sql.DateTime, timestamps)
      .query(`
        INSERT INTO Orders (user_id, restaurant_id, total_price, status, timestamps)
        OUTPUT INSERTED.order_id
        VALUES (@user_id, @restaurant_id, @total_price, @status, @timestamps)
      `);

    const order_id = result.recordset[0].order_id; // Capture the order_id of the newly inserted order
    console.log(order_id)
    console.log(result.recordset[0])

    // Step 2: Insert OrderDetails in a single transaction
    const orderDetailsPromises = orders.map(async (order) => {
      return pool.request()
        .input('order_id', sql.Int, order_id)
        .input('itemName', sql.VarChar(sql.MAX), order.itemName)
        .input('quantity', sql.Int, order.quantity)
        .input('price', sql.Decimal(10, 2), order.price)
        .query(`
          INSERT INTO OrderDetails (order_id, itemName, quantity, price)
          VALUES (@order_id, @itemName, @quantity, @price)
        `);
    });

    // Wait for all OrderDetails records to be inserted
    await Promise.all(orderDetailsPromises);

    res.status(201).send({'message':'Order created successfully!'});
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).send(err.message);
  }
});

app.get('/reviews/:restaurantId', async (req, res) => {
    try {
        const restaurantId = parseInt(req.params.restaurantId, 10);  // 🔥 parse to integer
        const reviews = await RatingReview.find({ restaurant_id: restaurantId });
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).send(err.message);
    }
});

// POST route to add a rating and review
app.post('/ratingreviews', async (req, res) => {
  const { restaurant_id, user_id, rating, review } = req.body;

  // Validate input
  if (!restaurant_id || !user_id || !rating || !review) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Create a new rating and review document
    const newRatingReview = new RatingReview({
      restaurant_id,
      user_id,
      rating,
      review
    });

    // Save to the database
    await newRatingReview.save();

    return res.status(201).json({
      message: 'Rating and review successfully added',
      data: newRatingReview
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error saving the review', error: error.message });
  }
});

// Log an event
app.post('/logs', async (req, res) => {
    const { event_type, user_id } = req.body;
    try {
        const newLog = new Log({
            log_id: new mongoose.Types.ObjectId(),
            event_type,
            user_id,
            timestamp: new Date()
        });
        await newLog.save();
        res.status(201).send('Log created successfully');
    } catch (err) {
        console.error('Error logging event:', err);
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

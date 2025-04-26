// server.js

import express from 'express';
import cors from 'cors';
import sql from 'mssql'; // <-- important for Windows Auth
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

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

const RatingReviewSchema = new mongoose.Schema({
    restaurant_id: Number,
    user_id: Number,
    rating: Number,
    review: String
});

const LogSchema = new mongoose.Schema({
    log_id: mongoose.Schema.Types.ObjectId,
    event_type: String,
    user_id: Number,
    timestamp: Date
});

const Menu = mongoose.model('Menu', MenuSchema);
const RatingReview = mongoose.model('RatingReview', RatingReviewSchema);
const Log = mongoose.model('Log', LogSchema);

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
app.get('/restaurants/:zipCode', async (req, res) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const zipCode = `%${req.params.zipCode}%`;
        console.log(zipCode)
        const result = await pool.request()
            .input('zipCode', sql.VarChar, zipCode)
            .query('SELECT * FROM Restaurants WHERE zip_code LIKE @zipCode');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching restaurants:', err);
        res.status(500).send(err.message);
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

    res.json({ message: 'Login successful', user_id: user.user_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
  

// Post a new order
app.post('/orders', async (req, res) => {
    const { user_id, restaurant_id, items, total_price, status } = req.body;
    try {
        const pool = await sql.connect(sqlConfig);
        await pool.request().query(`
            INSERT INTO Orders (user_id, restaurant_id, items, total_price, status, timestamps)
            VALUES (${user_id}, ${restaurant_id}, '${items}', ${total_price}, '${status}', GETDATE())
        `);
        res.status(201).send('Order created successfully');
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).send(err.message);
    }
});

// Get reviews for a restaurant
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

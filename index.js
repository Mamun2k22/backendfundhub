const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// const cookieSession = require("cookie-session");
// const passportSetup = require("./passport");
// const passport = require("passport");
const app = express();
const port = process.env.PORT || 5000;
const secretKey = 'your_secret_key'; // Change this to your own secret key

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());


// app.use(
//   cookieSession({ name: "session", keys: ["lama"], maxAge: 24 * 60 * 60 * 100 })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     methods: "GET,POST,PUT,DELETE",
//     credentials: true,
//   })
// );

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb+srv://TheFund:1234mamun@cluster0.seq8zxw.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Define a schema for the user model
const userSchema = new mongoose.Schema({
  title: String,
  name: String,
  lastName: String,
  email: String,
  number: String,
  password: String,
  country: String,

});

// Create a user model based on the schema
const User = mongoose.model('User', userSchema);

// Define the POST route for user registration
app.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    const newUser = new User(userData);
    await newUser.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define the POST route for user login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // If the user doesn't exist or the password is incorrect, return an error
    if (!user || user.password !== password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate a JWT token
    const token = jwt.sign({ email: user.email }, secretKey, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify the JWT for protected routes
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = decoded.email;
    next();
  });
}

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected route accessed' });
});

// Define the default route
app.get('/', (req, res) => {
  res.send('Running Server');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

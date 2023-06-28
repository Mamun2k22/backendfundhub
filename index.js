const express = require('express');
require('dotenv').config();
require ('./config/passport')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var session = require('express-session')
const User = require("./models/user.model")
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const saltRounds = 10;
// const cookieSession = require("cookie-session");
// const passportSetup = require("./passport");
const passport = require("passport");
const app = express();
const MongoStore = require('connect-mongo');

// Express session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl : process.env.MONGO_URL,
    collectionName : 'sessions'
  })
  // cookie: { secure: true }
}))
app.use(passport.initialize())
app.use(passport.session())

const port = process.env.PORT || 5000;
const secretKey = 'your_secret_key'; // Change this to your own secret key

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

  // Musfiq Code
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'thefundedhub@gmail.com',
      pass: process.env.APP_PASS,
    },
  });
  

  app.post('/register', async (req, res) => {
    try {
      const saltRounds = 10;
      bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        if (err) {
          throw new Error('Error hashing password');
        }
  
        const verificationToken = jwt.sign({ email: req.body.email }, secretKey, {
          expiresIn: '1h',
        });
  
        const userData = req.body;
        const newUser = new User({
          lastName: req.body.lastName,
          password: hash,
          verificationToken: verificationToken,
        });
  
        await newUser.save();
  
        const mailOptions = {
          from: 'thefundedhub@gmail.com',
          to: req.body.email,
          subject: 'Account Verification',
          text: `Click on the following link to verify your account: http://localhost:5000/verify/${verificationToken}`,
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            throw new Error('Error sending verification email');
          }
          console.log('Verification email sent:', info.response);
        });
  
        res.json({ message: 'User registered successfully' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });



app.post('/login', passport.authenticate('local', { successRedirect: '/' }));

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

// Verify email route
app.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Find the user with the provided verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(404).json({ message: 'Invalid verification token' });
      
    }

    // Update user's verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.sendFile(__dirname +"/index.html");
  } catch (error) {
    console.error('Error in email verification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google authentication routes
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['dashboard'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
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
  res.send('The FundedHub Running Server');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

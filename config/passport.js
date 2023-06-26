const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require('../models/user.model')
const bcrypt = require("bcrypt")

passport.use(
    new LocalStrategy(async(lastName, password, done) =>{
      try {
        const user = await User.findOne({ lastName: lastName });
        // wrong username
        if (!user) {
          return done(null, false, { message: "Incorrect Username" });
        }
  
        // wrong password
        if (!bcrypt.compare(password, user.password)) {
          return done(null, false, { message: "Incorrect Password" });
        }
  
        // if user found
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

 // whenever we login it user creases id inside session
passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // find session info using session id
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  });

  // Google Authentication
  passport.use(
    new GoogleStrategy(
      {
        clientID: '673666542167-q524cp9d4iin7fnj1m41678binhqc5ng.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: "http://localhost:5000/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          const user = await User.findOne({ googleId: profile.id });
          if (user) {
            return cb(null, user);
          } else {
            const newUser = new User({
              googleId: profile.id,
              username: profile.displayName,
            });
            await newUser.save();
            return cb(null, newUser);
          }
        } catch (error) {
          return cb(error, null);
        }
      }
    )
  );
  
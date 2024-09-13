import express from "express";
const router = express.Router();
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.js'
import { changePasswordProcess, registerTrigger, requestForgotPasswordProcess, verifyToken, resendEmailVerification } from "../controllers/authController.js";
import Cart from "../models/cart.js";

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Configure Passport Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await User.findOrCreate(
        { username: profile.id },
        {
          email: profile.emails[0].value, 
          name: profile.displayName,
          verified : true
        }
      );

      const user = result.doc; 
      const created = result.created;

      // If the user is created for the first time, create a cart for them
      if (created) {
        const newCart = new Cart({ user: user._id, items: [] });
        await newCart.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Routes for Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login?auth=false' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/login' , (req,res) => {
    if(req.isAuthenticated()){
        res.redirect('/');
    } else {
        res.render('login');
    }
});

router.get('/register' , (req,res) => {
    if(req.isAuthenticated()){
        res.redirect('/');
    } else{
        res.render('register');
    }
});


router.post('/register' , registerTrigger);

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/auth/login?auth=false'
}), function(req, res) {
    if(req.body.redirect_uri == ''){
        res.redirect('/');
    } else {
        const modifiedString = req.body.redirect_uri.replace('?redirect_uri=', '');
        res.redirect(modifiedString);
    }

});

router.get('/forgot-password' , async (req,res) => {
    if(req.isAuthenticated()){
        res.redirect('/');
    } else {
        res.render('forgot-password');
    }
});

router.get('/verify-token' , verifyToken);

router.post('/change-password' , changePasswordProcess);

router.post('/request-password-reset' , requestForgotPasswordProcess);

router.get('/resend-email-verification-email' , resendEmailVerification);



export default router;
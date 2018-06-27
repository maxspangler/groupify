const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();

// Load User Model
const User = mongoose.model('User');

const {ensureAuthenticated} = require('../helpers/auth');
const {validateUserInput} = require('../helpers/validateUserInput');


// User Login Route
router.get('/login', (req, res) => {
  res.render('users/login');
});

// User Register Route
router.get('/register', (req, res) => {
  res.render('users/register');
});

// Update Profile Route
router.put('/profile/update/:id', ensureAuthenticated, (req, res) => {
  User.findOne({_id: req.params.id})
    .then(user => {
      let errors = validateUserInput(req.body);
      if(errors.length > 0) {
        req.flash('error_msg', 'Please make sure your password meets the minimum requirements.');
        res.redirect(`/users/profile/${user._id}`)
      }
      else {
        user.name = req.body.name;
        user.email = req.body.email;
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if(err) throw err;
            user.password = hash;
            user.save()
              .then(user => {
                req.flash('success_msg', 'Profile updated.');
                res.redirect(`/users/profile/${user._id}`);
              })
              .catch(err => {
                console.log(err);
                return;
              });
          });
        });
      }
    })
    .catch(err => console.log(err));
});

router.get('/profile/:id', ensureAuthenticated, (req, res) => {
  User.findOne({_id: req.params.id})
    .then(user => {
      res.render('users/profile', 
      {
        profile: JSON.stringify(user),
        name: user.name,
        email: user.email,
        role: user.role     
      });
    })
    .catch(err => console.log(err)); 
});


// Login Route with role forking
router.post('/login', passport.authenticate('local', {
    failureRedirect: '/users/login',
    failureFlash: true
  }), (req, res) => {
    if (req.user.role === 'Revenue Manager') {
      res.redirect('/revenue/dashboard');
    }
    else {
      res.redirect('/sales/dashboard')
    }
  });




// Register Form POST
router.post('/register', (req, res) => {
  let errors = validateUserInput(req.body);
  if(errors.length > 0){
    res.render('users/register', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      password2: req.body.password2
    });
  } else {
    User.findOne({email: req.body.email})
      .then(user => {
        if(user){
          req.flash('error_msg', 'Email already registered');
          res.redirect('/users/register');
        } else {
          const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
          });

          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if(err) throw err;
              newUser.password = hash;
              newUser.save()
                .then(user => {
                  req.flash('success_msg', 'You are now registered and can log in');
                  res.redirect('/users/login');
                })
                .catch(err => {
                  console.log(err);
                  return;
                });
            });
          });
        }
      });
  }
});

// Logout User
router.get('/logout', (req, res)=> {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
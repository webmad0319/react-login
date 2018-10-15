const express = require('express');
const router  = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Sandwich = require('../models/Sandwich');
const passport = require('passport');


const login = (req, user) => {
  return new Promise((resolve,reject) => {
    req.login(user, err => {
      console.log('req.login ')
      console.log(user)

      
      if(err) {
        reject(new Error('Something went wrong'))
      }else{
        resolve(user);
      }
    })
  })
}


// SIGNUP
router.post('/signup', (req, res, next) => {

  const {username, password} = req.body;

  console.log('username', username)
  console.log('password', password)

  // Check for non empty user or password
  if (!username || !password){
    next(new Error('You must provide valid credentials'));
  }

  // Check if user exists in DB
  User.findOne({ username })
  .then( foundUser => {
    if (foundUser) throw new Error('Username already exists');

    const salt     = bcrypt.genSaltSync(10);
    const hashPass = bcrypt.hashSync(password, salt);

    return new User({
      username,
      password: hashPass
    }).save();
  })
  .then( savedUser => login(req, savedUser)) // Login the user using passport
  .then( user => res.json({status: 'signup & login successfully', user})) // Answer JSON
  .catch(e => next(e));
});

router.post('/sandwich', (req, res, next) => {
  const {name, ingredients} = req.body;

  console.log('username', name)
  console.log('ingredients', ingredients)

  // Check if user exists in DB
  Sandwich.findOne({ name })
  .then( foundSandwich => {
    if (foundSandwich) throw new Error('Sandwich already exists');

    return new Sandwich({
      name,
      ingredients
    }).save();
  })
  .then( sandwich => res.json({status: 'sandwich success', sandwich})) // Answer JSON
  .catch(e => next(e));
});

router.put('/sandwich/:name', (req, res, next) => {
  Sandwich.findOneAndUpdate({ name: req.params.name }, req.body)
  .then( sandwich => res.json({status: 'sandwich updated', sandwich})) // Answer JSON
  .catch(e => next(e));
});


router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, theUser, failureDetails) => {
    
    // Check for errors
    if (err) next(new Error('Something went wrong')); 
    if (!theUser) next(failureDetails)

    // Return user and logged in
    login(req, theUser).then(user => res.status(200).json(req.user));

  })(req, res, next);
});


router.get('/currentuser', (req,res,next) => {
  if(req.user){
    res.status(200).json(req.user);
  }else{
    next(new Error('Not logged in'))
  }
})


router.get('/logout', (req,res) => {
  req.logout();
  res.status(200).json({message:'logged out'})
});


router.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
})

module.exports = router;

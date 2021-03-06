const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {secretOrKey} = require('../../config/keys');
const passport = require('passport');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Users Works' }));

// @route 	POST api/users/register
// @desc 	Register new user
// @access 	Public
router.post('/register', (req, res) => {
	console.log(req.body)
	User.findOne({email: req.body.email})
		.then(user => {
			if(user) {
				return res.status(400).json({error: 'Email already exist'})
			} else {
					const {name, email, password} = req.body;
					const newUser = new User({name, email, password});
					
					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(newUser.password, salt, (err, hash) => {
							if(err) throw err;

							newUser.password = hash;
							newUser.save()
								.then(user => res.json(user))
								.catch(err => console.log(err));
						});
					});
				}
		});
});

// @route 	POST api/users/login
// @desc 	Login user
// @access 	Public
router.post('/login', (req, res) => {
	const {email, password} = req.body;
	User.findOne({email})
		.then(user => {
			if(!user) {
				return res.json({error: 'Email not found'});
			}
			bcrypt.compare(password, user.password)
				.then(isMatch => {
					if(isMatch) {
						// User is matched
						// Create JWT token
						const payload = {id: user.id, name: user.name};

						jwt.sign(payload, secretOrKey, {expiresIn: 3600}, (err, token) => {
							res.json({
								success: true,
								token: 'Bearer ' + token
							});
						});
					} else {
						return res.status(400).json({error: 'Password incorrect'});
					}
				});
		});
});

// @route 	GET api/users/current
// @desc 	Get current User
// @access 	Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);

module.exports = router;

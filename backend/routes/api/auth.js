const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator/check');

const User = require('../../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({msg: 'Error!'});
  }
});

router.post('/',
    [
      check('name', 'Name is required.').not().isEmpty(),
      check('email', 'Invalid email.').isEmail(),
      check('password', 'Password is required.').
          exists(),
    ],
    async (req, res) => {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
      }

      const {email, password} = req.body();

      try {
        let user = await Users.findOne({email});
        if (!user) {
          return res.status(400).
              json({errors: [{msg: 'Invalid credentials.'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).
              json({errors: [{msg: 'Invalid credentials.'}]});
        }

        // return jwt.
        const payload = {
          user: {
            id: user.id,

          },
        };

        jwt.sign(payload, config.get('jwtToken'), {expiresIn: 3600},
            (err, token) => {
              if (err) throw err;
              res.json({token});
            });

      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error.');

      }
    });

module.exports = router;
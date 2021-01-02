const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator/check');

const Users = require('../../models/User');

router.post('/',
    [
      check('name', 'Name is required.').not().isEmpty(),
      check('email', 'Invalid email.').isEmail(),
      check('password', 'Please enter minimum 6 chars password.').
          isLength({min: 6}),
    ],
    async (req, res) => {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
      }

      const {name, email, password} = req.body();

      try {
        let user = await Users.findOne({email});

        if (user) {
          return res.status(400).
              json({errors: [{msg: 'Users already exists.'}]});
        }

        const avatar = gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm',
        });

        user = new Users({name, email, avatar, password});

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

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
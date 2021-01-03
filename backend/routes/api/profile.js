const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config/default.json');
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

router.get('/me', async (req, res) => {
  try {
    const profile = await Profile.findOne({user: req.user.id}).
        populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({msg: 'No such profile.'});
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
});

router.post('/', [
      auth, [
        check('status', 'Status is required.').not().isEmpty(),
        check('skills', 'Skills is required.').not().isEmpty(),
      ]],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
      }

      const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin,
      } = req.body;

      const profileFields = {};
      profileFields.user = req.user.id;
      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.location = location;
      if (bio) profileFields.bio = bio;
      if (status) profileFields.status = status;
      if (githubusername) profileFields.githubusername = githubusername;
      if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
      }
      // Build social profile.
      socialProfile = {};
      if (youtube) socialProfile.youtube = youtube;
      if (facebook) socialProfile.facebook = facebook;
      if (twitter) socialProfile.twitter = twitter;
      if (instagram) socialProfile.instagram = instagram;
      if (linkedin) socialProfile.linkedin = linkedin;
      profileFields.social = socialProfile;

      try {
        let profile = Profile.findOne({user: req.user.id});
        if (profile) {
          // Update
          profile = await Profile.findOneAndUpdate(
              {user: req.user.id},
              {$set: profileFields},
              {new: true});

          return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        await Profile.save();
        res.json(profile);

      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error.');
      }
    });

// get all.
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// get by uid.
router.get('/user/:uid', async (req, res) => {
  try {
    const profile = await Profile.findOne({user: req.params.uid}).
        populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({msg: 'There is no profile for this uid.'});
    }

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({msg: 'There is no profile for this uid.'});
    }

    res.status(500).send('Server error');
  }
});

// delete (based on the token).
router.delete('/', auth, async (req, res) => {
  try {
    // Remove profile.
    await Profile.findOneAndRemove({user: req.user.id});
    // Remove user.
    await User.findOneAndRemove({_id: req.user.id});

    res.json({msg: 'User removed.'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.put('/experience', [
      auth, [
        check('title', 'Title is required').not().isEmpty(),
        check('company', 'company is required').not().isEmpty(),
        check('from', 'from is required').not().isEmpty(),
      ]],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
      }

      const {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
      } = req.body;

      const newExp = {title, company, location, from, to, current, description};

      try {
        const profile = await Profile.findOne({user: req.user.id});
        profile.exp.unshift(newExp);
        await profile.save();
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error.');
      }

    });

router.delete('/experience/:eid', auth,
    async (req, res) => {
      try {
        const profile = await Profile.findOne({user: req.user.id});
        const removeIndex = profile.experience.map(item => item.id).
            indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
      }

    });

router.put('/education', [
      auth, [
        check('school', 'school is required').not().isEmpty(),
        check('degree', 'degree is required').not().isEmpty(),
        check('fieldOfStudy', 'fieldOfStudy is required').not().isEmpty(),
        check('from', 'from is required').not().isEmpty(),
      ]],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
      }

      const {
        school,
        degree,
        fieldOfStudy,
        from,
        to,
        current,
        description,
      } = req.body;

      const newExp = {school, degree, fieldOfStudy, from, to, current, description};

      try {
        const profile = await Profile.findOne({user: req.user.id});
        profile.education.unshift(newExp);
        await profile.save();
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error.');
      }

    });

router.delete('/education/:eid', auth,
    async (req, res) => {
      try {
        const profile = await Profile.findOne({user: req.user.id});
        const removeIndex = profile.eduction.map(item => item.id).
            indexOf(req.params.exp_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
      }

    });

router.get('/github/:username', auth, async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5
      &sort=created:asc&client_id=${config.get('clientIdGithub')}&client_secret=${config.get('clientSecret')}`,
      method: 'GET',
      headers: {'user-agent': 'node.js'},
    };

    request(options, (error, response, body)=> {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        res.status(404).json({msg: 'Github profile not found'});
      }

      res.json(JSON.parse(body));
    })

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
})

module.export = router;
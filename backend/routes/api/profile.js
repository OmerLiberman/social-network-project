const express = require('express');
const router = express.Router();
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
    const profile = await Profile.findOne({user: req.params.uid})
    .populate('user', ['name', 'avatar']);

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

module.export = router;
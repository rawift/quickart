import User from '../models/user.js';

export const checkVerified = async (req, res, next) => {
  try {

    if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.redirect('/auth/login');
    }

    // Avoid infinite redirects
    if (!user.verified) {
      return res.redirect('/add-product');
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

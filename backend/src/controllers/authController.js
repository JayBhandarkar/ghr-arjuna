const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, annualIncome } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      email, password, name,
      annualIncome: annualIncome ? Number(annualIncome) : 0,
    });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, annualIncome: user.annualIncome }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, annualIncome: user.annualIncome }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // Fetch fresh from DB — not just the middleware-cached req.user
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        annualIncome: user.annualIncome ?? 0,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, annualIncome } = req.body;
    const userId = req.user._id;

    // Check if new email already taken by another user
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
    }

    const updateFields = {
      ...(name && { name }),
      ...(email && { email }),
      ...(annualIncome !== undefined && { annualIncome: Number(annualIncome) }),
    };

    const updated = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, select: '-password' }
    );

    const token = generateToken(updated._id);

    res.json({
      token,
      user: { id: updated._id, email: updated.email, name: updated.name, annualIncome: updated.annualIncome },
    });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    // Fetch user WITH password field (normally excluded by protect middleware)
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Set new password — the pre-save hook will hash it automatically
    user.password = newPassword;
    await user.save();

    // Return a fresh token
    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, annualIncome: user.annualIncome },
      message: 'Password updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Password change failed.', error: error.message });
  }
};

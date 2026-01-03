const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/profile - Get user profile
router.get('/', protect, async (req, res) => {
  try {
    // Get user data from database
    const user = req.user;
    
    // Create profile object with user data
    let userProfile = {
      id: user._id,
      name: user.username,
      email: user.email,
      joinDate: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      avatar: user.avatar || '',
      bio: user.bio || 'Passionate about personal development and continuous learning. Always striving to become a better version of myself.',
      location: user.location || 'San Francisco, CA',
      website: user.website || 'https://johndoe.dev',
      stats: {
        challengesCompleted: 0,
        studyHours: 0,
        totalSavings: 0,
        goalsAchieved: 0,
        currentStreak: 0,
        totalPoints: 0
      },
      achievements: [
        { id: 1, name: 'First Challenge Completed', icon: '🎯', unlocked: false },
        { id: 2, name: 'Week Warrior', icon: '⚔️', unlocked: false },
        { id: 3, name: 'Saver Pro', icon: '💰', unlocked: false },
        { id: 4, name: 'Goal Getter', icon: '🎯', unlocked: false },
        { id: 5, name: 'Study Master', icon: '📚', unlocked: false },
        { id: 6, name: 'Challenge Champion', icon: '🏆', unlocked: false }
      ],
      preferences: {
        emailNotifications: user.preferences?.emailNotifications || true,
        pushNotifications: user.preferences?.pushNotifications || false,
        darkMode: user.preferences?.darkMode || false,
        language: user.preferences?.language || 'en'
      }
    };
    
    // Try to get real stats from other modules
    try {
      const Transaction = require('../models/Transaction');
      const Challenge = require('../models/Challenge');
      const LifePlan = require('../models/LifePlan');
      
      // Get real stats
      const totalSavings = await Transaction.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0);
      
      const challengesCompleted = await Challenge.countDocuments({ 
        userId: user._id, 
        status: 'completed' 
      });
      
      const goalsAchieved = await LifePlan.countDocuments({ 
        userId: user._id, 
        status: 'achieved' 
      });
      
      // Update profile with real stats
      userProfile.stats = {
        ...userProfile.stats,
        totalSavings,
        challengesCompleted,
        goalsAchieved,
        totalPoints: challengesCompleted * 100 + goalsAchieved * 50 + Math.floor(totalSavings / 10)
      };
      
      // Unlock achievements based on stats
      userProfile.achievements[0].unlocked = challengesCompleted > 0; // First Challenge
      userProfile.achievements[2].unlocked = totalSavings > 1000; // Saver Pro
      userProfile.achievements[3].unlocked = goalsAchieved > 0; // Goal Getter
      
    } catch (statsError) {
      console.log('Stats not available, using default values');
    }
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile data'
    });
  }
});

// PUT /api/profile - Update user profile
router.put('/', protect, async (req, res) => {
  try {
    const updates = req.body;
    const user = req.user;
    
    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        $set: {
          username: updates.name || user.username,
          email: updates.email || user.email,
          bio: updates.bio,
          location: updates.location,
          website: updates.website,
          avatar: updates.avatar,
          // Update preferences if provided
          ...(updates.preferences && { preferences: updates.preferences })
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create response profile object
    const responseProfile = {
      id: updatedUser._id,
      name: updatedUser.username,
      email: updatedUser.email,
      joinDate: new Date(updatedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      avatar: updatedUser.avatar || '',
      bio: updatedUser.bio || 'Passionate about personal development and continuous learning. Always striving to become a better version of myself.',
      location: updatedUser.location || 'San Francisco, CA',
      website: updatedUser.website || 'https://johndoe.dev',
      preferences: updatedUser.preferences || {
        emailNotifications: true,
        pushNotifications: false,
        darkMode: false,
        language: 'en'
      }
    };
    
    res.json({
      success: true,
      data: responseProfile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// PUT /api/profile/preferences - Update user preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const preferences = req.body;
    const user = req.user;
    
    // Update user preferences in database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        $set: { 
          preferences: {
            ...user.preferences,
            ...preferences
          }
        }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedUser.preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

module.exports = router;

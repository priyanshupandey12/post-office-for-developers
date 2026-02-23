const User=require('../models/user.model')
const { clerkClient } = require('@clerk/express');

const getOrCreateUser = async (req, res, next) => {
  try {
     const { userId: clerkUserId } = await req.auth();
    
   
    let user = await User.findOne({ clerkId: clerkUserId });
    
  
    if (!user) {
      console.log(' User not found in DB, fetching from Clerk...');
    
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      
   
      user = await User.create({
        clerkId: clerkUserId,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        profilePicture: clerkUser.imageUrl || '',
        role: 'user'
      });
      
      console.log(' New user created:', user.email);
    }
    

    req.user = user;
    next();
  } catch (error) {
    console.error(' Get/Create user error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to process user data',
      details: error.message 
    });
  }
};


const getCurrentUser = async (req, res) => {
  try {
      res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        profilePicture: req.user.profilePicture,
        bio: req.user.bio,
        githubUrl: req.user.githubUrl,
        linkedinUrl: req.user.linkedinUrl,
        websiteUrl: req.user.websiteUrl,
        wins: req.user.wins,
        rating: req.user.rating,
        totalSubmissions: req.user.totalSubmissions,
        totalProblemsPosted: req.user.totalProblemsPosted,
        createdAt: req.user.createdAt,
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const updateProfile = async (req, res) => {
  try {
  
    const allowedFields = ['bio', 'skills', 'githubUrl', 'linkedinUrl', 'websiteUrl'];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });


    if (updateData.role && updateData.role !== 'developer') {
      delete updateData.role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-clerkId -email -totalProblemsPosted -totalSubmissions -wins -rating -portfolio');

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'Profile update ho gaya!', user: updatedUser });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    res.status(500).json({ success: false, error: 'Profile update nahi ho payi' });
  }
};





const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const developers = await User.find({ role: 'developer' })
      .sort({ wins: -1, rating: -1, totalSubmissions: -1 })
      .limit(limit)
      .select('name profilePicture wins rating totalSubmissions skills');
    
    res.json({
      success: true,
      count: developers.length,
      leaderboard: developers
    });
  } catch (error) {
    console.error(' Get leaderboard error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};



module.exports = {
  getOrCreateUser,
  getCurrentUser,
  updateProfile,
  getLeaderboard
};
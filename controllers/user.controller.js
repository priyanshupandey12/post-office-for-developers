const User=require('../models/user.model')
const { clerkClient } = require('@clerk/express');

const getOrCreateUser = async (req, res, next) => {
  try {
    const clerkUserId = req.clerkUserId;
    
   
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
        role: req.user.role,
        profilePicture: req.user.profilePicture,
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

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    ).select("-clerkId");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors)
          .map(e => e.message)
          .join(", ")
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update profile"
    });
  }
};


const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    

    if (!role || !['user', 'developer'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid role. Must be "user" or "developer"' 
      });
    }
    

    req.user.role = role;
    await req.user.save();
    
    res.json({
      success: true,
      message: `Role updated to ${role}`,
      user: {
        id: req.user._id,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error(' Switch role error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-clerkId') 
      .populate({
        path: 'portfolio',
        select: 'title category status createdAt'
      });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Get user by ID error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
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
  switchRole,
  getUserById,
  getLeaderboard
};
const User=require('../models/user.model')
const Submission = require('../models/submission.model');
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
    const period = req.query.period || 'all'; 


    let dateFilter = {};
    if (period === 'month') {
      dateFilter = { createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'week') {
      dateFilter = { createdAt: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) } };
    }


    const votesData = await Submission.aggregate([
      { $match: { ...dateFilter } },
      {
        $group: {
          _id: '$developerId',
          totalVotes: { $sum: { $size: '$votedBy' } },
          totalSubmissions: { $sum: 1 },
          wins: { $sum: { $cond: ['$isWinner', 1, 0] } }
        }
      }
    ]);


    const developerIds = votesData.map(d => d._id);
    const users = await User.find({ _id: { $in: developerIds } })
      .select('name profilePicture wins totalSubmissions rating');


    const leaderboard = votesData.map(d => {
      const user = users.find(u => u._id.toString() === d._id?.toString());
      if (!user) return null;

      const score = (d.wins * 10) + d.totalVotes + d.totalSubmissions;

      return {
        userId: user._id,
        name: user.name,
        profilePicture: user.profilePicture,
        wins: d.wins,
        totalVotes: d.totalVotes,
        totalSubmissions: d.totalSubmissions,
        rating: user.rating,
        score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((d, idx) => ({ ...d, rank: idx + 1 }));

    res.json({ success: true, count: leaderboard.length, period, leaderboard });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



module.exports = {
  getOrCreateUser,
  getCurrentUser,
  updateProfile,
  getLeaderboard
};
const User=require('../models/user.model')
const Problem=require('../models/problem.model')
const mongoose = require('mongoose');

const createProblem=async(req,res)=>{
     const session = await mongoose.startSession();
  try {
    const {
      title, 
      category,
       affectedAudience, 
       description,
      painLevel,
       frequency, 
       hasExistingSolutions,
      existingSolutionsDescription, 
      desiredOutcome,
       deadline
    } = req.body;


 
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);


   let problemsThisMonth = 0;
    let problem;

    await session.withTransaction(async () => {
    const problemsThisMonth = await Problem.countDocuments({
    postedBy: req.user._id,
    createdAt: { $gte: startOfMonth }
  }, { session });

  if (problemsThisMonth >= 2) {
    throw Object.assign(new Error('Monthly limit reached'), { code: 'LIMIT_REACHED' });
  }


      const [created] = await Problem.create([{
        title,
         category,
          affectedAudience, 
          description,
        painLevel, 
        frequency, 
        hasExistingSolutions,
        existingSolutionsDescription: hasExistingSolutions  ? existingSolutionsDescription : "",
        desiredOutcome, 
        deadline,
        postedBy: req.user._id,
      }], { session });


      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalProblemsPosted: 1 }
      }, { session });

      problem = created;
    });

    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Problem posted successfully",
      problem,
      remainingThisMonth: 2 - (problemsThisMonth + 1)
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: messages
      });
    }
    if (error.code === 'LIMIT_REACHED') {
  return res.status(403).json({ success: false, error: error.message });
}
    console.error("Create problem error:", error);
    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again."
    });
  }  finally {
  session.endSession();
}
 
}

const getAllProblems = async (req, res) => {
  try {

    const {
      category,
      painLevel,
      frequency,
      affectedAudience,
      status = 'open',
      search,
      page = 1,
      limit = 10,
      sortBy = 'recent',
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (painLevel) filter.painLevel = painLevel;
    if (frequency) filter.frequency = frequency;
    if (status) filter.status = status;

    if (affectedAudience) {
      filter.affectedAudience = {
        $in: Array.isArray(affectedAudience)
          ? affectedAudience
          : [affectedAudience]
      };
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');

      filter.$or = [
        { title: regex },
        { description: regex }
      ];
    }

    // pagination
    const skip = (page - 1) * limit;

    // default sort
    let sortOption = { createdAt: -1 };

    if (sortBy === 'deadline') {

      // exclude expired
      filter.deadline = { $gt: new Date() };

      sortOption = { deadline: 1 };
    }

    else if (sortBy === 'priority') {
      sortOption = { priorityScore: -1 };
    }

    else if (sortBy === 'submissions') {
      sortOption = { submissionCount: -1 };
    }

    else if (sortBy === 'recent') {
      sortOption = { createdAt: -1 };
    }

    const [problems, total] = await Promise.all([

      Problem.find(filter)
        .populate('postedBy', 'name profilePicture')
        .sort(sortOption)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .select('-submissions'),

      Problem.countDocuments(filter)

    ]);

    res.json({
      success: true,
      count: problems.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      problems
    });

  }
  catch (error) {

    console.error('Get all problems error:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, error: 'Problem ID is required' });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid problem ID format' });
    }

    const problem = await Problem.findById(id)
      .populate('postedBy', 'name profilePicture bio location')
      // .populate({
      //   path: 'submissions',
      //   populate: {
      //     path: 'developerId',
      //     select: 'name profilePicture wins rating totalSubmissions'
      //   },
      //   options: { sort: { votes: -1 } }
      // })
      // .populate('selectedWinner', 'title developerId votes techStack githubLink liveLink');

    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

  
    Problem.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

    res.json({ success: true, problem });

  } catch (error) {
    console.error('Get problem by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      affectedAudience,
      description,
      painLevel,
      frequency,
      hasExistingSolutions,
      existingSolutionsDescription,
      desiredOutcome,
      deadline
    } = req.body;

  
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

  
    if (problem.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to update this problem'
      });
    }

   
    if (problem.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: `Cannot update problem with status: ${problem.status}. Only open problems can be edited.`
      });
    }

   
    if (problem.submissions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update problem that already has submissions'
      });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (category !== undefined) updateFields.category = category;
    if (affectedAudience !== undefined) updateFields.affectedAudience = affectedAudience;
    if (description !== undefined) updateFields.description = description;
    if (painLevel !== undefined) updateFields.painLevel = painLevel;
    if (frequency !== undefined) updateFields.frequency = frequency;
    if (hasExistingSolutions !== undefined) updateFields.hasExistingSolutions = hasExistingSolutions;
    if (existingSolutionsDescription !== undefined) updateFields.existingSolutionsDescription = existingSolutionsDescription;
    if (desiredOutcome !== undefined) updateFields.desiredOutcome = desiredOutcome;
    if (deadline !== undefined) updateFields.deadline = deadline;


    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      updateFields,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('postedBy', 'name profilePicture');

    res.json({
      success: true,
      message: 'Problem updated successfully',
      problem: updatedProblem
    });

  } catch (error) {

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }

    console.error('Update problem error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update problem. Please try again.'
    });
  }
};

const closeProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }


    if (problem.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to close this problem'
      });
    }

 
    if (['solved', 'closed'].includes(problem.status)) {
      return res.status(400).json({
        success: false,
        error: `Problem is already ${problem.status}`
      });
    }

    problem.status = 'closed';
    await problem.save();

    res.json({
      success: true,
      message: 'Problem closed successfully',
      problem: {
        _id: problem._id,
        title: problem.title,
        status: problem.status
      }
    });

  } catch (error) {
    console.error('Close problem error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close problem. Please try again.'
    });
  }
};


const getMyProblems = async (req, res) => {
  try {
    const { 
      status, 
      category,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;


    const filter = { postedBy: req.user._id };
    
    if (status) {
      filter.status = status;
    }
    
    if (category) {
      filter.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;


    const problems = await Problem.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'submissions',
        select: 'title developerId isWinner votes createdAt',
        populate: {
          path: 'developerId',
          select: 'name profilePicture'
        }
      })
      .populate('selectedWinner', 'title developerId')
   


    const enrichedProblems = problems.map(problem => ({
      ...problem,
      submissionCount: problem.submissions.length,
      hasWinner: !!problem.selectedWinner,
      daysUntilDeadline: Math.ceil((new Date(problem.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
      isExpired: new Date(problem.deadline) < new Date()
    }));

    const total = await Problem.countDocuments(filter);


    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    
    const problemsThisMonth = await Problem.countDocuments({
      postedBy: req.user._id,
      createdAt: { $gte: startOfMonth }
    });

    const remainingPosts = Math.max(0, 2 - problemsThisMonth);


    const stats = {
      total,
      open: await Problem.countDocuments({ postedBy: req.user._id, status: 'open' }),
      inReview: await Problem.countDocuments({ postedBy: req.user._id, status: 'in_review' }),
      solved: await Problem.countDocuments({ postedBy: req.user._id, status: 'solved' }),
      closed: await Problem.countDocuments({ postedBy: req.user._id, status: 'closed' }),
      problemsThisMonth,
      remainingPostsThisMonth: remainingPosts
    };

    res.json({
      success: true,
      count: enrichedProblems.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      stats,
      problems: enrichedProblems
    });

  } catch (error) {
    console.error('Get my problems error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your problems. Please try again.'
    });
  }
};



module.exports={
  createProblem,
  getAllProblems,
  getProblemById, 
  updateProblem,
  getMyProblems,
  closeProblem
}
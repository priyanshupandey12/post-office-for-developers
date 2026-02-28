const Submission = require('../models/submission.model');
const Problem = require('../models/problem.model');
const mongoose = require('mongoose');
const logger = require('../middleware/logger.middleware');

const createSubmission = async (req, res) => {
  try {
    const { problemId, title, description, githubLink, liveLink, videoDemo, techStack, features } = req.body;

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem Not Found' });
    }

    
    if (new Date() > problem.deadline) {
      return res.status(400).json({ success: false, error: 'Problem ki deadline nikal chuki hai' });
    }

    if (!['open', 'in_review'].includes(problem.status)) {
      return res.status(400).json({ success: false, error: 'Cant Accept' });
    }


    if (problem.postedBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Aap apni posted problem pe submit nahi kar sakte' });
    }

        const submissionCount = await Submission.countDocuments({ 
      problemId, 
      status: { $nin: ['rejected'] } 
         });

if (submissionCount >= 10) {
  return res.status(400).json({ 
    success: false, 
    error: 'Is problem pe maximum 10 submissions aa chuki hain. Ab nahi ho sakti.' 
  });
}

    const submission = await Submission.create({
      problemId,
      developerId: req.user._id,
      title,
      description,
      githubLink,
      liveLink,
      videoDemo,
      techStack,
      features
    });

    await Problem.findByIdAndUpdate(problemId, {
         $addToSet: { submissions: submission._id },
           $inc: { submissionCount: 1 },
          $set: { status: 'in_review' }
         });

    logger.info('Submission created', {
      submissionId: submission._id,
      problemId,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Submission posted successfully',
      submission
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'You have already submitted the Problem' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: 'Validation failed', details: messages });
    }
     logger.error('Failed to create submission', { error, problemId: req.body.problemId, userId: req.user?._id });
    res.status(500).json({ success: false, error: 'Failed to create submission. Please try again.' });
  }
};


const getSubmissionsByProblem = async (req, res) => {
  try {
    const { problemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ success: false, error: 'Invalid problem ID' });
    }

    const problem = await Problem.findById(problemId).select('_id').lean();
    if (!problem) {
          logger.warn('Submissions requested for non-existent problem', {
        problemId,
        userId: req.user?._id
      });
      return res.status(404).json({ success: false, error: 'Problem not Found' });
    }

    const submissions = await Submission.find({
      problemId,
      status: { $nin: ['draft', 'rejected'] }
    })
      .populate('developerId', 'name profilePicture totalSubmissions')
      .sort({ votedBy: -1, createdAt: 1 })
      .select('-votedBy'); 

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });

  } catch (error) {
     logger.error('Failed to fetch submissions for problem', {
      error,
      problemId: req.params.problemId,
      userId: req.user?._id
    });
    res.status(500).json({ success: false, error: 'Failed to fetch submissions for problem. Please try again.' });
  }
};


const getMySubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { developerId: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('problemId', 'title category deadline status submissionCount selectedWinner')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Submission.countDocuments(filter)
    ]);

 
    const stats = {
      total,
      won: await Submission.countDocuments({ developerId: req.user._id, isWinner: true }),
      submitted: await Submission.countDocuments({ developerId: req.user._id, status: 'submitted' }),
      accepted: await Submission.countDocuments({ developerId: req.user._id, status: 'accepted' }),
    };

       logger.info('User submissions fetched', {
      userId: req.user._id,
      page,
      limit,
      total: stats.total
    });

    res.json({
      success: true,
      count: submissions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      stats,
      submissions
    });

  } catch (error) {
  logger.error('Failed to fetch user submissions', { error, userId: req.user?._id, query: req.query });
    res.status(500).json({ success: false, error: 'Failed to fetch your submissions. Please try again.' });
  }
};


const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid submission ID' });
    }

    const submission = await Submission.findById(id)
      .populate('developerId', 'name profilePicture totalSubmissions')
      .populate('problemId', 'title category deadline status');

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

 
    Submission.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

      logger.info('Submission fetched by ID', {
      submissionId: id,
      userId: req.user?._id
      });
    res.json({ success: true, submission });

  } catch (error) {

    logger.error('Failed to fetch submission by ID', { error, submissionId: req.params.id, userId: req.user?._id });
    res.status(500).json({ success: false, error: 'Failed to fetch submission. Please try again.' });
  }
};


const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, githubLink, liveLink, videoDemo, techStack, features } = req.body;

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    if (submission.developerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only edit your own submission' });
    }


    if (submission.isWinner) {
      return res.status(400).json({ success: false, error: 'Winner submission cannot be edited' });
    }

    if (!['draft', 'submitted'].includes(submission.status)) {
      return res.status(400).json({ success: false, error: 'This submission cannot be edited anymore' });
    }


    if (title) submission.title = title;
    if (description) submission.description = description;
    if (githubLink) submission.githubLink = githubLink;
    if (liveLink !== undefined) submission.liveLink = liveLink;
    if (videoDemo !== undefined) submission.videoDemo = videoDemo;
    if (techStack) submission.techStack = techStack;
    if (features) submission.features = features;

    await submission.save();

    res.json({ success: true, message: 'Submission updated successfully', submission });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: 'Validation failed', details: messages });
    }
      logger.error('Failed to update submission', { error, submissionId: req.params.id, userId: req.user?._id });
    res.status(500).json({ success: false, error: 'Failed to update submission. Please try again.' });
  }
};


const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission nahi mili' });
    }

    if (submission.developerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Aap sirf apni submission delete kar sakte ho' });
    }

    if (submission.isWinner) {
      return res.status(400).json({ success: false, error: 'Winner submission delete nahi ho sakti' });
    }

    await Submission.findOneAndDelete({ _id: id });

    res.json({ success: true, message: 'Submission wapas le li gayi' });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ success: false, error: 'Delete nahi ho payi, dobara try karo' });
  }
};


const voteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

 
    if (submission.developerId.toString() === userId.toString()) {
      return res.status(403).json({ success: false, error: 'You cannot vote on your own submission' });
    }

    const alreadyVoted = submission.votedBy.includes(userId);

    if (alreadyVoted) {
      await submission.removeVote(userId);
    } else {
      await submission.addVote(userId);
    }

    res.json({
      success: true,
      message: alreadyVoted ? 'Vote removed' : 'Vote added',
      voteCount: submission.votedBy.length,
      hasVoted: !alreadyVoted
    });

  } catch (error) {
    logger.error('Failed to vote on submission', { error, submissionId: req.params.id, userId: req.user?._id });
    res.status(500).json({ success: false, error: 'Failed to vote on submission. Please try again.' });
  }
};

const selectWinner = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not Found' });

    const problem = await Problem.findById(submission.problemId);
    if (!problem) return res.status(404).json({ success: false, error: 'Problem not Found' });

    if (problem.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Only the poster can select a winner' });
    }

    if (problem.selectedWinner) {
      return res.status(400).json({ success: false, error: 'Winner already selected' });
    }

    await Submission.updateMany({ problemId: problem._id }, { isWinner: false, status: 'submitted' });

    submission.isWinner = true;
    submission.status = 'accepted';
    await submission.save();

    problem.selectedWinner = submission._id;
    problem.status = 'solved';
    await problem.save();

    await User.findByIdAndUpdate(submission.developerId, { $inc: { wins: 1 } });

    res.json({ success: true, message: 'Winner selected successfully!', submission });

  } catch (error) {
    logger.error('Select winner error:', { error, problemId: req.params.id });
    res.status(500).json({ success: false, error: 'An error occurred while selecting the winner' });
  }
};

module.exports = {
  createSubmission,
  getSubmissionsByProblem,
  getMySubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  voteSubmission,
  selectWinner
};
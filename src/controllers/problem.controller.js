const User=require('../models/user.model')
const Problem=require('../models/problem.model')
const mongoose = require('mongoose');

const createProblem=async(req,res)=>{
     const session = await mongoose.startSession();
  try {
    const {
      title, 
      category,
      otherCategoryDescription,
       affectedAudience, 
       description,
      painLevel,
       frequency, 
       hasExistingSolutions,
      existingSolutionsDescription, 
      desiredOutcome,
       deadline
    } = req.body;

    if (category === "other" && !otherCategoryDescription?.trim()) {
  return res.status(400).json({
    success: false,
    error: "Please describe your category"
  });
}

 
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
        otherCategoryDescription,
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


module.exports={createProblem}
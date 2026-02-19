const cron = require('node-cron');
const Problem = require('../models/problem.model');
const Submission = require('../models/submission.model');

const handleExpiredProblems = async () => {
  try {
    const now = new Date();
    const gracePeriodEnd = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const pendingProblems = await Problem.find({
      status: 'in_review',
      deadline: { $lt: gracePeriodEnd },
      selectedWinner: null
    });

    console.log(`${pendingProblems.length} problems found without winner`);

    for (const problem of pendingProblems) {

      const submissions = await Submission.find({
        problemId: problem._id,
        status: 'submitted'
      }).sort({ votes: -1, createdAt: 1 });


      if (!submissions.length) {
        problem.status = 'closed';
        await problem.save();
        console.log(`No submissions — problem closed: ${problem._id}`);
        continue;
      }

      const highestVotes = submissions[0].votes;
      const topSubmissions = submissions.filter(s => s.votes === highestVotes);

      let winner;
      if (topSubmissions.length === 1) {
        winner = topSubmissions[0];
        console.log(`Clear winner: ${winner._id}`);
      } else {
    
        winner = topSubmissions[0];
        console.log(`Tie — earliest submission wins: ${winner._id}`);
      }

      winner.isWinner = true;
      winner.status = 'accepted';
      await winner.save();

      problem.selectedWinner = winner._id;
      problem.status = 'solved';
      await problem.save();

      console.log(`Auto winner selected for problem: ${problem._id} — extended: ${!!problem.originalDeadline}`);
    }

  } catch (error) {
    console.error('Cron job error:', error);
  }
};

cron.schedule('0 9 * * *', async () => {
  console.log('Running deadline cron job...');
  await handleExpiredProblems();
});

module.exports = { handleExpiredProblems };
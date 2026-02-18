const mongoose = require("mongoose");
const { CATEGORIES, SEVERITY, FREQUENCY, USERS_AFFECTED } = require("../constants/problem.constant.js");

const problemSchema = new mongoose.Schema(
  {
    title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [20, 'Title must be at least 20 characters'],
    maxlength: [100, 'Title must be less than 100 characters'],
    validate: {
      validator: function(title) {
        const blockedWords = ['app', 'website', 'platform', 'system', 'build', 'create', 'make', 'develop'];
        const titleLower = title.toLowerCase();
        return !blockedWords.some(word => titleLower.includes(word));
      },
      message: 'Title should describe a problem/friction, not a solution. Avoid words like app, website, build, create etc.'
    }
    },

    category: {
      type: String,
      enum: CATEGORIES,
       required: [true, 'Category is required'],
      index: true
    },

    affectedAudience: {
      type: [String],
      enum: USERS_AFFECTED,
      required: [true, 'Please select who faces this problem'],
      validate: {
      validator: function(audience) {
        if (audience.length === 0) return false;
 
        return audience.every(a => USERS_AFFECTED.includes(a));
      },
      message: 'Please select at least one valid audience'
    },
      index: true
    },

    description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [500, 'Description must be less than 500 characters'],
    validate: {
      validator: function(desc) {
        const blockedWords = ['i want an app', 'build me', 'create a website', 'make an app', 'develop a'];
        const descLower = desc.toLowerCase();
        return !blockedWords.some(phrase => descLower.includes(phrase));
      },
      message: 'Description should explain the problem, not suggest a solution'
    }
    },

    painLevel: {
      type: String,
      enum: SEVERITY,
      required: [true, 'Pain level is required'],
      index: true
    },

    frequency: {
      type: String,
      enum: FREQUENCY,
      required: [true, 'Frequency is required'],
      index: true
    },

    hasExistingSolutions: {
    type: Boolean,
    required: [true, 'Please specify if existing solutions exist']
  },
  existingSolutionsDescription: {
    type: String,
    maxlength: [300, 'Must be less than 300 characters'],
    default: '',
    validate: {
      validator: function(desc) {
        if (this.hasExistingSolutions === true && (!desc || desc.trim() === '')) {
          return false;
        }
        return true;
      },
      message: 'Please explain why existing solutions are not good enough'
    }
  },

   desiredOutcome: {
   type: String,
    required: [true, 'Desired outcome is required'],
    minlength: [20, 'Desired outcome must be at least 20 characters'],
    maxlength: [300, 'Desired outcome must be less than 300 characters'],
    validate: {
      validator: function(outcome) {

        const blockedWords = ['ai', 'app', 'website', 'platform', 'software', 'application', 'chatbot', 'bot'];
        const outcomeLower = outcome.toLowerCase();

        return !blockedWords.some(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(outcomeLower);
        });
      },
      message: 'Desired outcome should describe a result, not a solution. Avoid words like AI, app, website, platform etc.'
    }
    },

    postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'solved', 'closed'],
    default: 'open'
  },
    priorityScore: {
    type: Number,
    default: 0,
    index: true
  },
    submissionCount: {
    type: Number,
    default: 0,
    index: true
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    default: []
  }],
  selectedWinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    default: null
  },
  views: {
    type: Number,
    default: 0
  }

  },
{
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}
);

problemSchema.pre('save', function(next) {

  const painScores = {
    'safety-risk': 5,
    stressful: 4,
    'costs-money': 3,
    'time-consuming': 2,
    'mild-inconvenience': 1
  };

  const frequencyScores = {
    daily: 4,
    weekly: 3,
    monthly: 2,
    'rare-but-serious': 2
  };

  this.priorityScore =
    (painScores[this.painLevel] || 0) +
    (frequencyScores[this.frequency] || 0);

  this.submissionCount = this.submissions?.length || 0;

  next();
});

problemSchema.virtual('isExpired').get(function() {
  return new Date() > this.deadline;
});




problemSchema.index({ title: 1 });

module.exports = mongoose.model('Problem', problemSchema);

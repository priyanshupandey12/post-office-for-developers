const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  

  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: [true, 'Problem ID is required'],
    index: true
  },

  developerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Developer ID is required'],
    index: true
  },


  title: {
    type: String,
    required: [true, 'Solution title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters'],
    maxlength: [100, 'Title must be less than 100 characters']
  },

  description: {
    type: String,
    required: [true, 'Solution description is required'],
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [1000, 'Description must be less than 1000 characters']
  },


  githubLink: {
    type: String,
    required: [true, 'GitHub link is required'],
    validate: {
      validator: function(url) {
        return /^https?:\/\/(www\.)?github\.com\/.+/.test(url);
      },
      message: 'Please provide a valid GitHub URL'
    }
  },

  liveLink: {
    type: String,
    default: '',
    validate: {
      validator: function(url) {
        if (!url) return true; 
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Please provide a valid URL'
    }
  },

  videoDemo: {
    type: String,
    default: '',
    validate: {
      validator: function(url) {
        if (!url) return true; 
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Please provide a valid URL'
    }
  },



  techStack: {
    type: [String],
    required: [true, 'Tech stack is required'],
    validate: {
      validator: function(arr) {
        return arr.length > 0 && arr.length <= 10;
      },
      message: 'Please provide 1-10 technologies used'
    }
  },

  features: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 10;
      },
      message: 'Maximum 10 features allowed'
    }
  },


  isWinner: {
    type: Boolean,
    default: false
  },


  votes: {
    type: Number,
    default: 0,
    min: 0
  },

  votedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  views: {
    type: Number,
    default: 0
  },


  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'rejected', 'accepted'],
    default: 'submitted'
  }

}, {
  timestamps: true
});


submissionSchema.index({ problemId: 1, createdAt: -1 });


submissionSchema.index({ developerId: 1, createdAt: -1 });


submissionSchema.index({ isWinner: 1 });


submissionSchema.index({ problemId: 1, developerId: 1 }, { unique: true });


submissionSchema.virtual('hasLiveDemo').get(function() {
  return !!this.liveLink;
});


submissionSchema.virtual('hasVideoDemo').get(function() {
  return !!this.videoDemo;
});


submissionSchema.virtual('voteCount').get(function() {
  return this.votedBy.length;
});


submissionSchema.methods.addVote = async function(userId) {
  if (!this.votedBy.includes(userId)) {
    this.votedBy.push(userId);
    this.votes = this.votedBy.length;
    await this.save();
    return true;
  }
  return false;
};


submissionSchema.methods.removeVote = async function(userId) {
  const index = this.votedBy.indexOf(userId);
  if (index > -1) {
    this.votedBy.splice(index, 1);
    this.votes = this.votedBy.length;
    await this.save();
    return true;
  }
  return false;
};


submissionSchema.post('save', async function(doc) {
  if (this.isNew) {
    const Problem = mongoose.model('Problem');
    await Problem.findByIdAndUpdate(doc.problemId, {
      $addToSet: { submissions: doc._id },
      $set: { status: 'in_review' }
    });

  
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(doc.developerId, {
      $inc: { totalSubmissions: 1 }
    });
  }
});


submissionSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Problem = mongoose.model('Problem');
    await Problem.findByIdAndUpdate(doc.problemId, {
      $pull: { submissions: doc._id }
    });

   
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(doc.developerId, {
      $inc: { totalSubmissions: -1 }
    });
  }
});


submissionSchema.set('toJSON', { virtuals: true });
submissionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Submission', submissionSchema);
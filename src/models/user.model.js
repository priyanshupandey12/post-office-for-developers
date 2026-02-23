const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true

  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name must be less than 100 characters'],
    minlength: [1, 'Name cannot be empty']

  },
  profilePicture: {
    type: String,
    default: ''
  },
  

  
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  githubUrl: {
    type: String,
    default: '',
    validate: {
    validator: function(url) {
        if (!url) return true;
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Invalid GitHub URL format'
    }

  },
  linkedinUrl: {
    type: String,
    default: '',
     validate: {
      validator: function(url) {
        if (!url) return true;
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Invalid linkedin URL format'
    }
  },
  websiteUrl: {
    type: String,
    default: '',
     validate: {
      validator: function(url) {
        if (!url) return true;
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Invalid website URL format'
    }
  },
  

  portfolio: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  

  totalProblemsPosted: {
    type: Number,
    default: 0
  },
  totalSubmissions: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});



userSchema.virtual('totalProjects').get(function() {
  return this.portfolio.length;
});

module.exports = mongoose.model('User', userSchema);
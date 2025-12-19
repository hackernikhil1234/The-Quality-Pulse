// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  site: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Site', 
    required: true 
  },
  inspector: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  materialTested: { 
    type: String, 
    required: true 
  },
  testResult: { 
    type: String, 
    enum: ['Pass', 'Fail', 'Pending'], 
    required: true 
  },
  complianceStatus: { 
    type: String, 
    enum: ['Compliant', 'Non-Compliant', 'Partially Compliant', 'Pending'], 
    default: 'Compliant' 
  },
  description: {
    type: String,
    trim: true
  },
  findings: {
    type: String,
    trim: true
  },
  recommendations: {
    type: String,
    trim: true
  },
  comments: String,
  images: [String],
  location: { lat: Number, lng: Number },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Submitted', 'Under Review'], 
    default: 'Pending' 
  },
  feedback: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComment: {
    type: String,
    trim: true
  },
  issues: [{
    description: String,
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    }
  }]
}, { 
  timestamps: true 
});

// Add pre-save middleware to capitalize status
reportSchema.pre('save', function(next) {
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
    
    // Map common status variations
    const statusMap = {
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'under review': 'Under Review',
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    
    if (statusMap[this.status.toLowerCase()]) {
      this.status = statusMap[this.status.toLowerCase()];
    }
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);
const mongoose = require('mongoose');

// Material specification sub-schema
const materialSpecificationSchema = new mongoose.Schema({
  material: {
    type: String,
    required: false,
    trim: true
  },
  grade: {
    type: String,
    required: false,
    trim: true
  },
  quantity: {
    type: Number,
    required: false,
    min: 0
  },
  unit: {
    type: String,
    required: false,
    trim: true,
    default: 'units'
  },
  supplier: {
    type: String,
    required: false,
    trim: true
  },
  deliveryDate: {
    type: Date,
    required: false
  },
  notes: {
    type: String,
    required: false,
    trim: true
  }
});

// Quality metrics sub-schema
const qualityMetricsSchema = new mongoose.Schema({
  complianceRate: {
    type: String,
    required: false,
    default: '0%'
  },
  qualityScore: {
    type: String,
    required: false,
    default: '0/10'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  totalReports: {
    type: Number,
    default: 0
  },
  approvedReports: {
    type: Number,
    default: 0
  },
  pendingReports: {
    type: Number,
    default: 0
  }
});

const siteSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  location: { 
    type: String,
    trim: true
  },
  coordinates: { 
    lat: { type: Number, default: 0 }, 
    lng: { type: Number, default: 0 }
  },
  startDate: { 
    type: Date,
    default: Date.now
  },
  expectedCompletion: {  // Changed from endDate to expectedCompletion
    type: Date 
  },
  endDate: {  // Keep for backward compatibility
    type: Date 
  },
  progress: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  status: { 
    type: String, 
    enum: ['Active', 'Paused', 'Completed', 'In Progress', 'On Hold', 'Delayed', 'Planning'], 
    default: 'Active' 
  },
  assignedEngineers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  // Location details
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  exactAddress: {
    type: String,
    trim: true
  },
  // Site type and category
  type: {
    type: String,
    trim: true,
    default: 'Construction Site',
    enum: ['Construction Site', 'Renovation Project', 'Infrastructure', 'Residential', 'Commercial', 'Industrial', 'Civil', 'Other']
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  // Created by reference
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Material specifications
  materialSpecifications: [materialSpecificationSchema],
  
  // Quality metrics (will be calculated)
  qualityMetrics: {
    type: qualityMetricsSchema,
    default: () => ({})
  },
  
  // Site manager/contact
  siteManager: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true }
  },
  
  // Budget information
  budget: {
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  
  // Safety metrics
  safetyMetrics: {
    totalIncidents: { type: Number, default: 0 },
    lastIncidentDate: { type: Date },
    safetyRating: { type: String, default: 'A' }
  },
  
  // Last inspection info
  lastInspection: {
    date: { type: Date },
    inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    result: { type: String, enum: ['Pass', 'Fail', 'Pending'], default: 'Pending' }
  },
  
  // Site photos/document references
  photos: [{
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Documents
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Notes and remarks
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Flags
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Virtual for full address
siteSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.exactAddress) parts.push(this.exactAddress);
  if (this.city) parts.push(this.city);
  if (this.country) parts.push(this.country);
  return parts.join(', ');
});

// Set location from address if not explicitly set
siteSchema.pre('save', function(next) {
  if (!this.location && (this.exactAddress || this.city || this.country)) {
    this.location = this.fullAddress;
  }
  
  // Set expectedCompletion from endDate if not set
  if (!this.expectedCompletion && this.endDate) {
    this.expectedCompletion = this.endDate;
  }
  
  // Set endDate from expectedCompletion if not set
  if (!this.endDate && this.expectedCompletion) {
    this.endDate = this.expectedCompletion;
  }
  
  next();
});

// Indexes for better query performance
siteSchema.index({ name: 1 });
siteSchema.index({ status: 1 });
siteSchema.index({ createdBy: 1 });
siteSchema.index({ assignedEngineers: 1 });
siteSchema.index({ country: 1, city: 1 });
siteSchema.index({ 'qualityMetrics.complianceRate': 1 });
siteSchema.index({ 'qualityMetrics.qualityScore': 1 });

// Method to calculate progress based on dates
siteSchema.methods.calculateProgress = function() {
  if (!this.startDate || !this.expectedCompletion) {
    return 0;
  }
  
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.expectedCompletion);
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  const totalDuration = end - start;
  const elapsed = now - start;
  return Math.min(Math.round((elapsed / totalDuration) * 100), 100);
};

// Method to update quality metrics
siteSchema.methods.updateQualityMetrics = async function() {
  const Report = require('./Report'); // Dynamic import to avoid circular dependency
  
  try {
    const reports = await Report.find({ site: this._id });
    const totalReports = reports.length;
    
    if (totalReports > 0) {
      const compliantReports = reports.filter(r => r.complianceStatus === 'Compliant').length;
      const complianceRate = Math.round((compliantReports / totalReports) * 100);
      
      // Calculate quality score
      const validScores = reports
        .map(r => {
          if (r.testResult && typeof r.testResult === 'object') {
            return r.testResult.overallScore || r.testResult.score || 0;
          }
          return 0;
        })
        .filter(score => !isNaN(score));
      
      const avgScore = validScores.length > 0 
        ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
        : 0;
      
      const approvedReports = reports.filter(r => r.status === 'Approved').length;
      const pendingReports = reports.filter(r => r.status === 'Pending').length;
      
      this.qualityMetrics = {
        complianceRate: `${complianceRate}%`,
        qualityScore: `${avgScore}/10`,
        lastUpdated: new Date(),
        totalReports,
        approvedReports,
        pendingReports
      };
      
      await this.save();
    }
    
    return this.qualityMetrics;
  } catch (error) {
    console.error('Error updating quality metrics:', error);
    return null;
  }
};

module.exports = mongoose.model('Site', siteSchema);
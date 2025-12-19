// services/analyticsService.js
import api from './api';

/**
 * Smart analytics service that provides real data when available,
 * and contextual demo data when real data is insufficient
 */
export const fetchAnalyticsData = async (timeRange) => {
  try {
    // Try to fetch real data from the server
    const res = await api.get(`/analytics?timeRange=${timeRange}`);
    const realData = res.data;
    
    // Define what "enough data" means
    const hasEnoughData = realData.totalReports >= 5; // At least 5 reports
    
    if (hasEnoughData) {
      return {
        ...realData,
        source: 'real',
        isDemo: false,
        message: 'Showing real data from your database'
      };
    } else {
      // Not enough real data, use demo data
      console.log('Insufficient real data, using demo data');
      return {
        ...realData, // Include whatever real data we have
        ...generateContextualDemoData(timeRange, realData), // Fill gaps with demo data
        source: 'hybrid',
        isDemo: true,
        message: realData.totalReports > 0 
          ? `Based on ${realData.totalReports} real reports (demo data augmented)`
          : 'Showing demo data. Create reports to see your real analytics!'
      };
    }
  } catch (error) {
    console.warn('Analytics API error, using demo data:', error.message);
    return {
      ...generateContextualDemoData(timeRange, {}),
      source: 'demo',
      isDemo: true,
      message: 'Demo data (API unavailable)'
    };
  }
};

/**
 * Generate intelligent demo data that adapts to your project's context
 */
const generateContextualDemoData = (timeRange, existingData = {}) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Base data - fill gaps with realistic values
  const baseData = {
    complianceRate: existingData.complianceRate || 78,
    totalReports: existingData.totalReports || 12,
    totalSites: existingData.totalSites || 3,
    totalEngineers: existingData.totalEngineers || 2,
    pendingReports: existingData.pendingReports || 2,
    approvedReports: existingData.approvedReports || 8,
    rejectedReports: existingData.rejectedReports || 2,
    passRate: existingData.passRate || 85,
    failRate: existingData.failRate || (100 - (existingData.passRate || 85)),
    avgResolutionTime: existingData.avgResolutionTime || 1.5,
    sitePerformance: existingData.sitePerformance || [
      { site: 'Main Site', compliance: 92, reports: 6 },
      { site: 'West Wing', compliance: 85, reports: 4 },
      { site: 'East Block', compliance: 78, reports: 2 }
    ],
    engineerPerformance: existingData.engineerPerformance || [
      { engineer: 'Site Engineer', reports: 8, compliance: 88 },
      { engineer: 'QA Inspector', reports: 4, compliance: 82 }
    ],
    materialCompliance: existingData.materialCompliance || [
      { material: 'Concrete', totalTests: 8, passRate: 87 },
      { material: 'Steel Bars', totalTests: 6, passRate: 92 },
      { material: 'Cement', totalTests: 4, passRate: 84 },
      { material: 'Bricks', totalTests: 3, passRate: 79 },
      { material: 'Aggregates', totalTests: 2, passRate: 81 }
    ]
  };

  // Generate trend data based on time range
  let trends = { daily: [], monthly: [] };
  
  switch(timeRange) {
    case 'day':
      // Last 24 hours in 3-hour intervals
      trends.daily = Array.from({ length: 8 }, (_, i) => {
        const hour = i * 3;
        return {
          date: `${hour.toString().padStart(2, '0')}:00`,
          reports: Math.floor(Math.random() * 3) + 1,
          compliance: Math.floor(Math.random() * 15) + 80
        };
      });
      break;
      
    case 'week':
      // Last 7 days
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      trends.monthly = days.map(day => ({
        month: day,
        reports: Math.floor(Math.random() * 4) + 1,
        compliance: Math.floor(Math.random() * 15) + 80
      }));
      break;
      
    case 'month':
      // Last 30 days in weekly segments
      trends.monthly = Array.from({ length: 4 }, (_, i) => ({
        month: `Week ${i + 1}`,
        reports: Math.floor(Math.random() * 6) + 2,
        compliance: Math.floor(Math.random() * 20) + 75
      }));
      break;
      
    case 'year':
      // Last 12 months (contextual to current month)
      trends.monthly = Array.from({ length: 12 }, (_, i) => {
        const monthIndex = (currentMonth - 11 + i + 12) % 12;
        const monthName = monthNames[monthIndex];
        return {
          month: monthName,
          reports: Math.floor(Math.random() * 6) + 2,
          compliance: Math.floor(Math.random() * 20) + 75
        };
      });
      break;
  }

  return {
    ...baseData,
    trends
  };
};

/**
 * Get data quality information
 */
export const getDataQualityInfo = (analyticsData) => {
  if (analyticsData.isDemo) {
    return {
      level: analyticsData.source === 'hybrid' ? 'partial' : 'demo',
      realReports: analyticsData.totalReports || 0,
      message: analyticsData.message
    };
  }
  
  return {
    level: 'real',
    realReports: analyticsData.totalReports,
    message: analyticsData.message
  };
};

export default { fetchAnalyticsData, getDataQualityInfo };
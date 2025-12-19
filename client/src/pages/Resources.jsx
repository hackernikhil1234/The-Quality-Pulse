// pages/Resources.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Resources() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('templates');

  const resources = {
    templates: [
      { title: 'Daily Quality Inspection', description: 'Standard template for daily construction quality checks', download: '/templates/daily-inspection.docx' },
      { title: 'Material Testing Report', description: 'Form for material quality test results', download: '/templates/material-testing.pdf' },
      { title: 'Safety Compliance Checklist', description: 'Comprehensive safety inspection checklist', download: '/templates/safety-checklist.pdf' },
      { title: 'Progress Report Template', description: 'Weekly construction progress reporting', download: '/templates/progress-report.docx' },
    ],
    guidelines: [
      { title: 'Concrete Quality Standards', description: 'ASTM and ACI standards for concrete quality', download: '/guidelines/concrete-standards.pdf' },
      { title: 'Steel Reinforcement Guidelines', description: 'Proper handling and installation of steel rebar', download: '/guidelines/steel-guidelines.pdf' },
      { title: 'Safety Protocol Manual', description: 'Complete safety procedures for construction sites', download: '/guidelines/safety-manual.pdf' },
      { title: 'Environmental Compliance', description: 'Environmental regulations and best practices', download: '/guidelines/environmental.pdf' },
    ],
    training: [
      { title: 'Quality Control Basics', description: 'Introduction to construction quality assurance', link: '#', type: 'video' },
      { title: 'Material Testing Procedures', description: 'Step-by-step guide for material testing', link: '#', type: 'pdf' },
      { title: 'Report Writing Workshop', description: 'How to write effective quality reports', link: '#', type: 'course' },
      { title: 'Safety Training Module', description: 'Mandatory safety training for site personnel', link: '#', type: 'course' },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Resources</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Access templates, guidelines, and training materials
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setActiveCategory('templates')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeCategory === 'templates'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              📝 Templates
            </button>
            <button
              onClick={() => setActiveCategory('guidelines')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeCategory === 'guidelines'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              📚 Guidelines
            </button>
            <button
              onClick={() => setActiveCategory('training')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeCategory === 'training'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              🎓 Training
            </button>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources[activeCategory].map((resource, index) => (
              <div key={index} className="card p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {resource.description}
                    </p>
                  </div>
                  <span className="text-2xl">
                    {activeCategory === 'training' ? '🎓' : '📄'}
                  </span>
                </div>
                
                <div className="mt-6">
                  {resource.download ? (
                    <a
                      href={resource.download}
                      download
                      className="btn-primary w-full text-center py-2"
                    >
                      Download
                    </a>
                  ) : (
                    <button className="btn-secondary w-full py-2">
                      Access Resource
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-12 card p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                to="/dashboard"
                className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg border border-blue-200 dark:border-blue-800/30 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-1">Dashboard</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Return to dashboard</p>
              </Link>
              
              <Link 
                to={user?.role === 'Engineer' ? '/engineer/reports' : '/reports'}
                className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-lg border border-green-200 dark:border-green-800/30 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-green-700 dark:text-green-400 mb-1">Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View all reports</p>
              </Link>
              
              <Link 
                to="/profile"
                className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-lg border border-purple-200 dark:border-purple-800/30 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-1">Profile</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your profile</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
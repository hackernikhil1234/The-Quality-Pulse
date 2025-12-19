// server/fixExistingSites.js
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server's .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const Site = require('./models/Site');
const User = require('./models/User');

async function fixExistingSites() {
  // Check if MONGO_URI is loaded
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in environment variables');
    console.log('Current working directory:', __dirname);
    console.log('Loading .env from:', path.join(__dirname, '.env'));
    process.exit(1);
  }
  
  console.log('Connecting to MongoDB...');
  console.log('MONGO_URI:', process.env.MONGO_URI.replace(/\/\/[^@]+@/, '//***:***@')); // Hide password
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
    
    console.log('Finding sites without createdBy field...');
    const sitesWithoutCreator = await Site.find({ 
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });
    
    console.log(`Found ${sitesWithoutCreator.length} sites without createdBy field`);
    
    if (sitesWithoutCreator.length === 0) {
      console.log('No sites need to be fixed. All sites have createdBy field.');
      mongoose.disconnect();
      return;
    }
    
    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: 'Admin' });
    
    if (!adminUser) {
      console.error('No admin user found! Please create an admin user first.');
      console.log('Available users:');
      const allUsers = await User.find({}, 'name email role');
      allUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      });
      mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`Using admin: ${adminUser.name} (${adminUser.email}) as default creator`);
    
    // Update each site
    let updatedCount = 0;
    for (const site of sitesWithoutCreator) {
      try {
        site.createdBy = adminUser._id;
        await site.save();
        updatedCount++;
        console.log(`✓ Updated site: ${site.name} (ID: ${site._id})`);
      } catch (error) {
        console.error(`✗ Failed to update site ${site.name}:`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} out of ${sitesWithoutCreator.length} sites`);
    
    // Verify the update
    const remainingSites = await Site.find({ 
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });
    console.log(`Remaining sites without createdBy: ${remainingSites.length}`);
    
    if (remainingSites.length > 0) {
      console.log('\nSites that still need createdBy field:');
      remainingSites.forEach(site => {
        console.log(`- ${site.name} (ID: ${site._id})`);
      });
    }
    
    mongoose.disconnect();
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the function
fixExistingSites();
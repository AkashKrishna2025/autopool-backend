require('dotenv').config();
const path = require('path');

console.log('Starting database seeding...');

// Import and run the admin seeder
require(path.join(__dirname, 'adminSeeder.js'));

// You can add more seeders here in the future
// For example: require(path.join(__dirname, 'otherSeeder.js')); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devtrack';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    seedDatabase();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });

const seedDatabase = async () => {
  const Developer = require('../models/Developer');
  const count = await Developer.countDocuments();

  if (count === 0) {
    console.log('Seeding initial developers...');
    const defaultPassword = bcrypt.hashSync('password123', 10);

    await Developer.create([
      { name: 'Sarah Martin',    email: 'sarah@devtrack.io',   password: defaultPassword, role: 'ADMIN',        color: '#6366f1' },
      { name: 'Pierre Dupont',   email: 'pierre@devtrack.io',  password: defaultPassword, role: 'PO',           color: '#f59e0b' },
      { name: 'Lucas Bernard',   email: 'lucas@devtrack.io',   password: defaultPassword, role: 'SCRUM_MASTER', color: '#8b5cf6' },
      { name: 'Alice Chen',      email: 'alice@devtrack.io',   password: defaultPassword, role: 'DEV',          color: '#10b981' },
      { name: 'Marc Leclerc',    email: 'marc@devtrack.io',    password: defaultPassword, role: 'DEV',          color: '#ef4444' },
      { name: 'Nina Rousseau',   email: 'nina@devtrack.io',    password: defaultPassword, role: 'QA',           color: '#f97316' },
      { name: 'Client Acme',     email: 'client@acme.io',      password: defaultPassword, role: 'CLIENT',       color: '#14b8a6' },
    ]);
    console.log('Developers seeded.');
  }
};

module.exports = mongoose;

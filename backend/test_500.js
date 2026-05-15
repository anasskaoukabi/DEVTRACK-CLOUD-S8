const mongoose = require('mongoose');
const TestPlan = require('./models/TestPlan');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/devtrack');
    await TestPlan.create({
      project_id: new mongoose.Types.ObjectId(),
      title: 'Test',
      start_date: '',
      end_date: '',
      created_by: new mongoose.Types.ObjectId()
    });
    console.log("Success");
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
test();

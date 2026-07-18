const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }));
    const hash = await bcrypt.hash('password123', 10);
    await Patient.updateOne({ email: 'patient@heidelberg.in' }, { $set: { passwordHash: hash } });
    console.log('Password updated');
    process.exit(0);
});

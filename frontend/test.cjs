const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'admin' 
    });
    const token = loginRes.data.token;
    
    const docRes = await axios.get('http://localhost:5000/api/appointments/meta/doctors', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const doctorId = docRes.data[0]._id;
    
    const patRes = await axios.get('http://localhost:5000/api/appointments/meta/patients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const patientId = patRes.data[0]._id;
    
    const payload = {
      patientId: patientId,
      doctorId: doctorId,
      appointmentDate: '2026-07-16',
      appointmentTime: '10:00',
      type: 'Walk-in',
      reasonForVisit: 'test'
    };
    
    console.log('Sending payload:', payload);
    const apptRes = await axios.post('http://localhost:5000/api/appointments', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', apptRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();

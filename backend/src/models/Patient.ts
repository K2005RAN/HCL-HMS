import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
    patientId?: string;
    employeeId?: mongoose.Types.ObjectId; // Link to employee if patient is an employee
    name: string;
    gender: string;
    dob: Date;
    bloodGroup?: string;
    phone: string;
    email: string;
    passwordHash: string;
    address: string;
    emergencyContact: string;
    chronicDiseases: string[];
    allergies: string[];
    familyHistory: string;
    vaccinationHistory: string[];
}

const PatientSchema: Schema = new Schema({
    patientId: { type: String, unique: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    bloodGroup: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    address: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    chronicDiseases: [{ type: String }],
    allergies: [{ type: String }],
    familyHistory: { type: String },
    vaccinationHistory: [{ type: String }]
}, {
    timestamps: true
});

export default mongoose.model<IPatient>('Patient', PatientSchema);

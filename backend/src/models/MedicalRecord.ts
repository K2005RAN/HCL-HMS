import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalRecord extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
    
    // Vitals
    bloodPressure: string;
    pulse: number;
    weight: number; // in kg
    height: number; // in cm
    temperature: number; // in F
    bmi: number;
    
    // Diagnosis & Notes
    symptoms: string[];
    diagnosis: string;
    prescription: {
        medicineName: string;
        dosage: string;
        duration: string;
        instructions: string;
    }[];
    labRequests: string[];
    followUpDate?: Date;
    fitnessCertificateIssued: boolean;
}

const MedicalRecordSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    
    bloodPressure: { type: String },
    pulse: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    temperature: { type: Number },
    bmi: { type: Number },
    
    symptoms: [{ type: String }],
    diagnosis: { type: String, required: true },
    prescription: [{
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String }
    }],
    labRequests: [{ type: String }],
    followUpDate: { type: Date },
    fitnessCertificateIssued: { type: Boolean, default: false }
}, {
    timestamps: true
});

export default mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);

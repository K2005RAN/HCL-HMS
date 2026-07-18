import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
    doctorId?: string;
    name: string;
    specialization: string;
    department: string;
    phone: string;
    email: string;
    passwordHash: string;
    availableDays: string[];
    availableTimeStart: string;
    availableTimeEnd: string;
    roomNumber?: string;
    isActive: boolean;
}

const DoctorSchema: Schema = new Schema({
    doctorId: { type: String, unique: true },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    department: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    availableDays: [{ type: String }],
    availableTimeStart: { type: String },
    availableTimeEnd: { type: String },
    roomNumber: { type: String },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);

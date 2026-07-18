import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
    employeeId: string;
    name: string;
    department: string;
    plant: string;
    contractor?: string;
    designation: string;
    gender: string;
    dob: Date;
    bloodGroup?: string;
    photoUrl?: string;
    phone: string;
    email: string;
    emergencyContact: string;
    address: string;
    shift: string;
    joiningDate: Date;
    status: string; // Active, Inactive, Resigned
}

const EmployeeSchema: Schema = new Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    plant: { type: String, required: true },
    contractor: { type: String },
    designation: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    bloodGroup: { type: String },
    photoUrl: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    address: { type: String, required: true },
    shift: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    status: { type: String, default: 'Active' },
}, {
    timestamps: true
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);

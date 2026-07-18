import mongoose, { Document, Schema } from 'mongoose';

export interface IStaff extends Document {
    staffId?: string;
    name: string;
    email: string;
    passwordHash: string;
    department: string;
    isActive: boolean;
}

const StaffSchema: Schema = new Schema({
    staffId: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    department: { type: String, required: true },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export default mongoose.model<IStaff>('Staff', StaffSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ILabUser extends Document {
    labId?: string;
    name: string;
    email: string;
    passwordHash: string;
    department: string;
    phone?: string;
    isActive: boolean;
}

const LabUserSchema: Schema = new Schema({
    labId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    department: { type: String, default: 'Laboratory' },
    phone: { type: String, default: 'N/A' },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export default mongoose.model<ILabUser>('LabUser', LabUserSchema);

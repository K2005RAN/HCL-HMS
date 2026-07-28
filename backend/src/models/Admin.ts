import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
}

const AdminSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export default mongoose.model<IAdmin>('Admin', AdminSchema);

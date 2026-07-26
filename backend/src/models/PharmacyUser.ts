import mongoose, { Document, Schema } from 'mongoose';

export interface IPharmacyUser extends Document {
    pharmacyId?: string;
    name: string;
    email: string;
    passwordHash: string;
    department: string;
    phone?: string;
    isActive: boolean;
}

const PharmacyUserSchema: Schema = new Schema({
    pharmacyId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    department: { type: String, default: 'Pharmacy' },
    phone: { type: String, default: 'N/A' },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export default mongoose.model<IPharmacyUser>('PharmacyUser', PharmacyUserSchema);

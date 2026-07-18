import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
    name: string;
    genericName: string;
    category: string; // e.g., Tablet, Syrup, Injection
    supplierId?: mongoose.Types.ObjectId;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
    unitPrice: number;
    lowStockThreshold: number;
    barcode?: string;
    isActive: boolean;
}

const MedicineSchema: Schema = new Schema({
    name: { type: String, required: true },
    genericName: { type: String, required: true },
    category: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true, default: 0 },
    unitPrice: { type: Number, required: true },
    lowStockThreshold: { type: Number, default: 50 },
    barcode: { type: String },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export default mongoose.model<IMedicine>('Medicine', MedicineSchema);

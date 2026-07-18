import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
    patientId: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
    invoiceNumber: string;
    date: Date;
    items: {
        description: string;
        amount: number;
    }[];
    subTotal: number;
    gstAmount: number;
    totalAmount: number;
    status: string; // Paid, Pending, Cancelled
    paymentMethod?: string;
}

const InvoiceSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    items: [{
        description: { type: String, required: true },
        amount: { type: Number, required: true }
    }],
    subTotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    paymentMethod: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
    patientId: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
    employeeId?: mongoose.Types.ObjectId;
    invoiceNumber: string;
    date: Date;
    patientType: 'Employee' | 'General';
    items: {
        description: string;
        amount: number;
        type?: 'Lab' | 'Medicine' | 'Consultation' | 'Other';
    }[];
    labCharges: number;
    medicineCharges: number;
    consultationCharges: number;
    subTotal: number;
    gstAmount: number;
    totalAmount: number;
    status: 'Paid' | 'Pending' | 'Salary Deduction' | 'Cancelled';
    paymentMethod: string;
}

const InvoiceSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    patientType: { type: String, enum: ['Employee', 'General'], default: 'General' },
    items: [{
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, default: 'Other' }
    }],
    labCharges: { type: Number, default: 0 },
    medicineCharges: { type: Number, default: 0 },
    consultationCharges: { type: Number, default: 0 },
    subTotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    paymentMethod: { type: String, default: 'Cash' }
}, {
    timestamps: true
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);

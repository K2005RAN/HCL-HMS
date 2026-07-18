import mongoose, { Document, Schema } from 'mongoose';

export interface ILabTest extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    testName: string;
    category: string; // e.g., Blood, Urine, X-Ray
    status: string; // Pending, Sample Collected, Completed
    sampleCollectedAt?: Date;
    resultsCompletedAt?: Date;
    resultNotes?: string;
    pdfReportUrl?: string;
}

const LabTestSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    testName: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    sampleCollectedAt: { type: Date },
    resultsCompletedAt: { type: Date },
    resultNotes: { type: String },
    pdfReportUrl: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<ILabTest>('LabTest', LabTestSchema);

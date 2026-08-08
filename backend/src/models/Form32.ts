import mongoose, { Document, Schema } from 'mongoose';

export interface IForm32 extends Document {
    serialNumber: string;
    date: Date;
    employeeId: mongoose.Types.ObjectId;
    
    // Counterfoil Data
    fatherName: string;
    sex: string;
    address: string;
    factoryName: string;
    processOrDepartment: string;
    certificateGranted: boolean;
    declaredUnfitAndRefused: boolean;
    previousCertificateRefNo?: string;
    
    // Main Certificate Data
    fitnessStatus: 'Fit' | 'Unfit' | 'FitForNonHazardousOnly';
    nonHazardousOperationsAllowed?: string;
    reexaminationPeriodMonths?: number;
    furtherExaminationAdvised?: string;
    treatmentAdvised?: string;
    
    certifyingSurgeonName?: string;
    certifyingSurgeonSignatureDate?: Date;
    place?: string;
}

const Form32Schema: Schema = new Schema({
    serialNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    
    fatherName: { type: String, required: true },
    sex: { type: String, required: true },
    address: { type: String, required: true },
    factoryName: { type: String, default: 'HeidelbergCement India Ltd. (Unit Damoh)' },
    processOrDepartment: { type: String, required: true },
    certificateGranted: { type: Boolean, default: true },
    declaredUnfitAndRefused: { type: Boolean, default: false },
    previousCertificateRefNo: { type: String },
    
    fitnessStatus: { type: String, enum: ['Fit', 'Unfit', 'FitForNonHazardousOnly'], default: 'Fit' },
    nonHazardousOperationsAllowed: { type: String },
    reexaminationPeriodMonths: { type: Number },
    furtherExaminationAdvised: { type: String },
    treatmentAdvised: { type: String },
    
    certifyingSurgeonName: { type: String },
    certifyingSurgeonSignatureDate: { type: Date, default: Date.now },
    place: { type: String, default: 'DAMOH' }
}, {
    timestamps: true
});

export default mongoose.model<IForm32>('Form32', Form32Schema);

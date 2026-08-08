import mongoose, { Document, Schema } from 'mongoose';

export interface IFormO extends Document {
    certificateNo: string;
    employeeId: mongoose.Types.ObjectId;
    doctorName?: string;
    mineName: string;
    formDNo?: string;
    examinationType: 'Initial' | 'Periodical';
    age: number;
    
    // Fitness Outcome (Page 1)
    fitnessStatus: 'Fit' | 'Unfit' | 'TemporarilyUnfit';
    unfitReason?: string;
    disabilityCurePeriodMonths?: number;
    reexaminationDate?: Date;
    permittedToWork: boolean;
    examiningAuthorityName?: string;
    examiningAuthorityDesignation?: string;
    
    // Page 2 - Report of Examining Authority
    identificationMarks?: string;
    generalDevelopment?: 'Good' | 'Fair' | 'Poor';
    height?: number; // cms
    weight?: number; // kg
    
    eyes?: {
        distantRight?: string;
        distantLeft?: string;
        organicDisease?: string;
        nightBlindness?: boolean;
        colourBlindness?: boolean;
        squint?: boolean;
    };
    
    ears?: {
        hearingRight?: string;
        hearingLeft?: string;
        organicDisease?: string;
    };
    
    respiratorySystem?: {
        chestInspiration?: number;
        chestExpiration?: number;
    };
    
    circulatorySystem?: {
        bloodPressure?: string;
        pulse?: number;
    };
    
    abdomen?: {
        tenderness?: string;
        liver?: string;
        spleen?: string;
        tumour?: string;
    };
    
    nervousSystem?: {
        fitsOrEpilepsyHistory?: boolean;
        paralysisHistory?: boolean;
        mentalHealth?: string;
    };
    
    locomotorySystem?: string;
    skin?: string;
    hydrocele?: string;
    hernia?: string;
    otherAbnormality?: string;
    
    urine?: {
        reaction?: string;
        albumin?: string;
        sugar?: string;
    };
    
    skiagramChest?: string;
    specialistOpinion?: string;
    
    // Page 3 - Cardiological, Neurological & ILO Radiograph
    cardiologicalAssessment?: {
        auscultationS1?: string;
        auscultationS2?: string;
        additionalSound?: string;
        ecg12LeadFindings?: 'Normal' | 'Abnormal';
        ecgEnclosed?: boolean;
    };
    
    neurologicalAssessment?: {
        superficialReflexes?: 'Normal' | 'Abnormal';
        deepReflexes?: 'Normal' | 'Abnormal';
        peripheralCirculation?: 'Normal' | 'Abnormal';
        vibrationalSyndromes?: 'Normal' | 'Abnormal';
    };
    
    iloChestRadiograph?: {
        pneumoconioticOpacities?: 'Present' | 'Absent';
        grades?: string;
        types?: string;
        radiographEnclosed?: boolean;
    };
    
    // Page 4 - Audiometry, Lab & Manganese Exposure
    audiometryFindings?: {
        leftEarCondition?: 'Normal' | 'Abnormal';
        rightEarCondition?: 'Normal' | 'Abnormal';
        leftBoneConduction?: 'Normal' | 'Abnormal';
        rightBoneConduction?: 'Normal' | 'Abnormal';
        findingsEnclosed?: boolean;
    };
    
    labInvestigations?: {
        cbcBloodTcDcHbEsrPlatelets?: 'WNL' | 'Abnormal';
        bloodSugarFastingPP?: 'WNL' | 'Abnormal';
        lipidProfile?: 'WNL' | 'Abnormal';
        bloodUreaCreatinine?: 'WNL' | 'Abnormal';
        urineRoutine?: 'WNL' | 'Abnormal';
        stoolRoutine?: 'WNL' | 'Abnormal';
        investigationsReportEnclosed?: boolean;
    };
    
    manganeseExposureSpecialTests?: {
        speechDefect?: 'Present' | 'Not Present';
        tremor?: 'Present' | 'Not Present';
        adiadocokinesia?: 'Present' | 'Not Present';
        emotionalChanges?: 'Present' | 'Not Present';
    };
    
    otherSpecialTestRequired?: string;
    
    // Page 5 - Lung Function Test (Spirometry)
    spirometryTest?: {
        fev?: { predicted?: number; performed?: number; percentPredicted?: number };
        fev1?: { predicted?: number; performed?: number; percentPredicted?: number };
        fev1FvcRatio?: { predicted?: number; performed?: number; percentPredicted?: number };
        peakExpiratoryFlow?: { predicted?: number; performed?: number; percentPredicted?: number };
        reportEnclosed?: boolean;
    };
    
    examinationDate: Date;
    place?: string;
}

const FormOSchema: Schema = new Schema({
    certificateNo: { type: String, required: true, unique: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    doctorName: { type: String },
    mineName: { type: String, default: 'DIAMOND PATHARIYA LIME STONE MINES' },
    formDNo: { type: String },
    examinationType: { type: String, enum: ['Initial', 'Periodical'], default: 'Periodical' },
    age: { type: Number, required: true },
    
    fitnessStatus: { type: String, enum: ['Fit', 'Unfit', 'TemporarilyUnfit'], default: 'Fit' },
    unfitReason: { type: String },
    disabilityCurePeriodMonths: { type: Number },
    reexaminationDate: { type: Date },
    permittedToWork: { type: Boolean, default: true },
    examiningAuthorityName: { type: String },
    examiningAuthorityDesignation: { type: String },
    
    identificationMarks: { type: String },
    generalDevelopment: { type: String, enum: ['Good', 'Fair', 'Poor'], default: 'Good' },
    height: { type: Number },
    weight: { type: Number },
    
    eyes: {
        distantRight: { type: String },
        distantLeft: { type: String },
        organicDisease: { type: String },
        nightBlindness: { type: Boolean, default: false },
        colourBlindness: { type: Boolean, default: false },
        squint: { type: Boolean, default: false },
    },
    
    ears: {
        hearingRight: { type: String },
        hearingLeft: { type: String },
        organicDisease: { type: String },
    },
    
    respiratorySystem: {
        chestInspiration: { type: Number },
        chestExpiration: { type: Number },
    },
    
    circulatorySystem: {
        bloodPressure: { type: String },
        pulse: { type: Number },
    },
    
    abdomen: {
        tenderness: { type: String },
        liver: { type: String },
        spleen: { type: String },
        tumour: { type: String },
    },
    
    nervousSystem: {
        fitsOrEpilepsyHistory: { type: Boolean, default: false },
        paralysisHistory: { type: Boolean, default: false },
        mentalHealth: { type: String },
    },
    
    locomotorySystem: { type: String },
    skin: { type: String },
    hydrocele: { type: String },
    hernia: { type: String },
    otherAbnormality: { type: String },
    
    urine: {
        reaction: { type: String },
        albumin: { type: String },
        sugar: { type: String },
    },
    
    skiagramChest: { type: String },
    specialistOpinion: { type: String },
    
    cardiologicalAssessment: {
        auscultationS1: { type: String },
        auscultationS2: { type: String },
        additionalSound: { type: String },
        ecg12LeadFindings: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
        ecgEnclosed: { type: Boolean, default: true },
    },
    
    neurologicalAssessment: {
        superficialReflexes: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
        deepReflexes: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
        peripheralCirculation: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
        vibrationalSyndromes: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
    },
    
    iloChestRadiograph: {
        pneumoconioticOpacities: { type: String, enum: ['Present', 'Absent'], default: 'Absent' },
        grades: { type: String },
        types: { type: String },
        radiographEnclosed: { type: Boolean, default: true },
    },
    
    audiometryFindings: {
        leftEarCondition: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
        rightEarCondition: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
        leftBoneConduction: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
        rightBoneConduction: { type: String, enum: ['Normal', 'Abnormal'], default: 'Normal' },
        findingsEnclosed: { type: Boolean, default: true },
    },
    
    labInvestigations: {
        cbcBloodTcDcHbEsrPlatelets: { type: String, enum: ['WNL', 'Abnormal'], default: 'WNL' },
        bloodSugarFastingPP: { type: String, enum: ['WNL', 'Abnormal'], default: 'WNL' },
        lipidProfile: { type: String, enum: ['WNL', 'Abnormal'], default: 'WNL' },
        bloodUreaCreatinine: { type: String, enum: ['WNL', 'Abnormal'], default: 'WNL' },
        urineRoutine: { type: String, enum: ['WNL', 'Abnormal'], default: 'WNL' },
        stoolRoutine: { type: String, enum: ['WNL', 'Abnormal'], default: 'WNL' },
        investigationsReportEnclosed: { type: Boolean, default: true },
    },
    
    manganeseExposureSpecialTests: {
        speechDefect: { type: String, enum: ['Present', 'Not Present'], default: 'Not Present' },
        tremor: { type: String, enum: ['Present', 'Not Present'], default: 'Not Present' },
        adiadocokinesia: { type: String, enum: ['Present', 'Not Present'], default: 'Not Present' },
        emotionalChanges: { type: String, enum: ['Present', 'Not Present'], default: 'Not Present' },
    },
    
    otherSpecialTestRequired: { type: String },
    
    spirometryTest: {
        fev: { predicted: Number, performed: Number, percentPredicted: Number },
        fev1: { predicted: Number, performed: Number, percentPredicted: Number },
        fev1FvcRatio: { predicted: Number, performed: Number, percentPredicted: Number },
        peakExpiratoryFlow: { predicted: Number, performed: Number, percentPredicted: Number },
        reportEnclosed: { type: Boolean, default: true },
    },
    
    examinationDate: { type: Date, default: Date.now },
    place: { type: String, default: 'DAMOH' }
}, {
    timestamps: true
});

export default mongoose.model<IFormO>('FormO', FormOSchema);

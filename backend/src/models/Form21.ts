import mongoose, { Document, Schema } from 'mongoose';

export interface IForm21 extends Document {
    srNo: number;
    employeeId: mongoose.Types.ObjectId;
    aadharNo?: string;
    contractorName?: string;
    certifyingSurgeonName?: string;
    medicalExamDate: Date;
    
    // Tabular Columns (1-15)
    workerEmpId: string;
    workerName: string;
    sex: string;
    age: number;
    dateOfEmploymentOnPresentWork?: Date;
    dateOfLeavingOrTransfer?: Date;
    reasonForLeavingOrTransfer?: string;
    natureOfJobOrOccupation: string;
    rawMaterialOrByproductHandled?: string;
    resultOfMedicalExamination: 'Fit' | 'Unfit' | 'Suspended';
    suspensionDetailsReason?: string;
    recertifiedFitDate?: Date;
    certificateOfUnfitnessIssued?: boolean;
    surgeonSignatureDate?: Date;
    
    // Pre-Employment & Periodic Exam Detail Sheet
    vitals?: {
        heightCms?: number;
        weightKg?: number;
        bmi?: number;
        chestInspirationCms?: number;
        chestExpirationCms?: number;
        built?: 'Average' | 'Strong' | 'Poor';
        throat?: string;
        tongue?: string;
        tonsils?: string;
        teeth?: string;
        gums?: string;
        thyroid?: string;
        lymphNodes?: string;
    };
    
    cardiovascular?: {
        pulsePerMin?: number;
        rhythm?: 'Regular' | 'Irregular';
        peripheralPulse?: 'Felt' | 'Not Felt';
        bpMmHg?: string;
        heartSoundS1S2?: string;
        murmur?: string;
        additionalFinding?: string;
    };
    
    respiratory?: {
        shapeOfChest?: string;
        chestMovements?: string;
        trachea?: string;
        breathSounds?: string;
    };
    
    gastrointestinal?: {
        liver?: string;
        spleen?: string;
        palpableAbdominalLump?: string;
    };
    
    eyes?: {
        externalExam?: string;
        squint?: string;
        nystagmus?: string;
        colourVision?: 'Normal' | 'Defective (Partial)' | 'Defective (Full)';
        fundusLeftRight?: string;
        distantVisionWithoutGlassesRight?: string;
        distantVisionWithoutGlassesLeft?: string;
        distantVisionWithGlassesRight?: string;
        distantVisionWithGlassesLeft?: string;
        nearVisionWithoutGlassesRight?: string;
        nearVisionWithoutGlassesLeft?: string;
        nearVisionWithGlassesRight?: string;
        nearVisionWithGlassesLeft?: string;
        nightBlindness?: boolean;
    };
    
    ent?: {
        externalExam?: string;
    };
    
    genitoUrinary?: {
        hernia?: string;
        hydroceleOrVaricocele?: string;
        cryptorchidism?: string;
        phimosis?: string;
        varicoseVeins?: string;
        signsOfStd?: string;
        femaleMenstrualObstetricHistory?: {
            menarcheAgeYrs?: number;
            gravida?: number;
            para?: number;
            lmp?: Date;
            menstrualIrregularity?: string;
        };
    };
    
    labInvestigations?: {
        hbGmPercent?: number;
        tlcCumm?: number;
        dlcPoly?: number;
        dlcLym?: number;
        dlcEos?: number;
        dlcMon?: number;
        dlcBas?: number;
        plateletsCountLacCumm?: number;
        rbcsMillionCumm?: number;
        bloodGroup?: string;
        rhFactor?: string;
        bloodSugarFastingMgDl?: number;
        bloodSugarRandomMgDl?: number;
        lipidProfileCholesterol?: number;
        lipidProfileHdl?: number;
        lipidProfileTriglycerides?: number;
        lipidProfileLdl?: number;
        lipidProfileVldl?: number;
        renalProfileUrea?: number;
        renalProfileCreatinine?: number;
        renalProfileUricAcid?: number;
        renalProfileSerumCal?: number;
        lftBilirubinTotal?: number;
        lftBilirubinDirect?: number;
        lftBilirubinIndirect?: number;
        lftSgot?: number;
        lftSgpt?: number;
        widalTest?: string;
        stoolOccultBlood?: string;
        stoolOvaCyst?: string;
        urineAlbumin?: string;
        urineSugar?: string;
    };
    
    otherInvestigations?: {
        xrayChestPaView?: string;
        ecg?: string;
        usgAbdomen?: string;
    };
    
    pulmonaryFunctionTest?: {
        fvcPredicted?: number;
        fvcMeasured?: number;
        fvcPercent?: number;
        fev1Predicted?: number;
        fev1Measured?: number;
        fev1Percent?: number;
        fev1FvcRatioPredicted?: number;
        fev1FvcRatioMeasured?: number;
        fev1FvcRatioPercent?: number;
    };
    
    personalHabits?: {
        tobaccoAlcoholGutkha?: string;
    };
    
    pastMedicalHistory?: {
        htDmHeartDiseaseNihlCopdOthers?: string;
    };
    
    audiometryFrequencies?: {
        hz125?: string;
        hz250?: string;
        hz500?: string;
        hz1000?: string;
        hz2000?: string;
        hz4000?: string;
        hz8000?: string;
    };
    
    specialMedicalTests?: {
        vdrlBloodExam?: string;
        wormInfectionStoolUrine?: string;
        skinDiseasesScreening?: string;
        tbXrayAndOtherTests?: string;
    };
    
    rule107OtherDetails?: string;
    remarkAndTreatment?: string;
    fitUnfitToWork: 'FIT TO WORK' | 'UNFIT TO WORK' | 'SUSPENDED';
    place?: string;
}

const Form21Schema: Schema = new Schema({
    srNo: { type: Number, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    aadharNo: { type: String },
    contractorName: { type: String },
    certifyingSurgeonName: { type: String },
    medicalExamDate: { type: Date, default: Date.now },
    
    workerEmpId: { type: String, required: true },
    workerName: { type: String, required: true },
    sex: { type: String, required: true },
    age: { type: Number, required: true },
    dateOfEmploymentOnPresentWork: { type: Date },
    dateOfLeavingOrTransfer: { type: Date },
    reasonForLeavingOrTransfer: { type: String },
    natureOfJobOrOccupation: { type: String, required: true },
    rawMaterialOrByproductHandled: { type: String },
    resultOfMedicalExamination: { type: String, enum: ['Fit', 'Unfit', 'Suspended'], default: 'Fit' },
    suspensionDetailsReason: { type: String },
    recertifiedFitDate: { type: Date },
    certificateOfUnfitnessIssued: { type: Boolean, default: false },
    surgeonSignatureDate: { type: Date, default: Date.now },
    
    vitals: {
        heightCms: Number,
        weightKg: Number,
        bmi: Number,
        chestInspirationCms: Number,
        chestExpirationCms: Number,
        built: { type: String, enum: ['Average', 'Strong', 'Poor'], default: 'Average' },
        throat: String,
        tongue: String,
        tonsils: String,
        teeth: String,
        gums: String,
        thyroid: String,
        lymphNodes: String,
    },
    
    cardiovascular: {
        pulsePerMin: Number,
        rhythm: { type: String, enum: ['Regular', 'Irregular'], default: 'Regular' },
        peripheralPulse: { type: String, enum: ['Felt', 'Not Felt'], default: 'Felt' },
        bpMmHg: String,
        heartSoundS1S2: String,
        murmur: String,
        additionalFinding: String,
    },
    
    respiratory: {
        shapeOfChest: String,
        chestMovements: String,
        trachea: String,
        breathSounds: String,
    },
    
    gastrointestinal: {
        liver: String,
        spleen: String,
        palpableAbdominalLump: String,
    },
    
    eyes: {
        externalExam: String,
        squint: String,
        nystagmus: String,
        colourVision: { type: String, enum: ['Normal', 'Defective (Partial)', 'Defective (Full)'], default: 'Normal' },
        fundusLeftRight: String,
        distantVisionWithoutGlassesRight: String,
        distantVisionWithoutGlassesLeft: String,
        distantVisionWithGlassesRight: String,
        distantVisionWithGlassesLeft: String,
        nearVisionWithoutGlassesRight: String,
        nearVisionWithoutGlassesLeft: String,
        nearVisionWithGlassesRight: String,
        nearVisionWithGlassesLeft: String,
        nightBlindness: { type: Boolean, default: false },
    },
    
    ent: { externalExam: String },
    
    genitoUrinary: {
        hernia: String,
        hydroceleOrVaricocele: String,
        cryptorchidism: String,
        phimosis: String,
        varicoseVeins: String,
        signsOfStd: String,
        femaleMenstrualObstetricHistory: {
            menarcheAgeYrs: Number,
            gravida: Number,
            para: Number,
            lmp: Date,
            menstrualIrregularity: String,
        }
    },
    
    labInvestigations: {
        hbGmPercent: Number,
        tlcCumm: Number,
        dlcPoly: Number,
        dlcLym: Number,
        dlcEos: Number,
        dlcMon: Number,
        dlcBas: Number,
        plateletsCountLacCumm: Number,
        rbcsMillionCumm: Number,
        bloodGroup: String,
        rhFactor: String,
        bloodSugarFastingMgDl: Number,
        bloodSugarRandomMgDl: Number,
        lipidProfileCholesterol: Number,
        lipidProfileHdl: Number,
        lipidProfileTriglycerides: Number,
        lipidProfileLdl: Number,
        lipidProfileVldl: Number,
        renalProfileUrea: Number,
        renalProfileCreatinine: Number,
        renalProfileUricAcid: Number,
        renalProfileSerumCal: Number,
        lftBilirubinTotal: Number,
        lftBilirubinDirect: Number,
        lftBilirubinIndirect: Number,
        lftSgot: Number,
        lftSgpt: Number,
        widalTest: String,
        stoolOccultBlood: String,
        stoolOvaCyst: String,
        urineAlbumin: String,
        urineSugar: String,
    },
    
    otherInvestigations: {
        xrayChestPaView: String,
        ecg: String,
        usgAbdomen: String,
    },
    
    pulmonaryFunctionTest: {
        fvcPredicted: Number,
        fvcMeasured: Number,
        fvcPercent: Number,
        fev1Predicted: Number,
        fev1Measured: Number,
        fev1Percent: Number,
        fev1FvcRatioPredicted: Number,
        fev1FvcRatioMeasured: Number,
        fev1FvcRatioPercent: Number,
    },
    
    personalHabits: { tobaccoAlcoholGutkha: String },
    pastMedicalHistory: { htDmHeartDiseaseNihlCopdOthers: String },
    
    audiometryFrequencies: {
        hz125: String,
        hz250: String,
        hz500: String,
        hz1000: String,
        hz2000: String,
        hz4000: String,
        hz8000: String,
    },
    
    specialMedicalTests: {
        vdrlBloodExam: String,
        wormInfectionStoolUrine: String,
        skinDiseasesScreening: String,
        tbXrayAndOtherTests: String,
    },
    
    rule107OtherDetails: String,
    remarkAndTreatment: String,
    fitUnfitToWork: { type: String, enum: ['FIT TO WORK', 'UNFIT TO WORK', 'SUSPENDED'], default: 'FIT TO WORK' },
    place: { type: String, default: 'DAMOH' }
}, {
    timestamps: true
});

export default mongoose.model<IForm21>('Form21', Form21Schema);

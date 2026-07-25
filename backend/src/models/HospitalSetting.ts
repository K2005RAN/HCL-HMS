import mongoose, { Schema, Document } from 'mongoose';

export interface IHospitalSetting extends Document {
    key: string;
    value: any;
}

const HospitalSettingSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true }
}, {
    timestamps: true
});

export default mongoose.model<IHospitalSetting>('HospitalSetting', HospitalSettingSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
    staffId: string;
    staffName: string;
    department: string;
    userRef?: mongoose.Types.ObjectId;
    date: Date;
    clockIn?: Date;
    clockOut?: Date;
    status: string; // 'Present', 'Signed Off', 'Absent'
    shift?: string;
    remarks?: string;
}

const AttendanceSchema: Schema = new Schema({
    staffId: { type: String, required: true },
    staffName: { type: String, required: true },
    department: { type: String, required: true, default: 'General' },
    userRef: { type: Schema.Types.ObjectId, ref: 'Staff' },
    date: { type: Date, required: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    status: { type: String, required: true, default: 'Present' },
    shift: { type: String, default: 'Morning' },
    remarks: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);

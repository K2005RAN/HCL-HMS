import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
    employeeId: mongoose.Types.ObjectId;
    date: Date;
    clockIn?: Date;
    clockOut?: Date;
    status: string; // Present, Absent, Half-Day, Leave
    shift: string;
    remarks?: string;
}

const AttendanceSchema: Schema = new Schema({
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    status: { type: String, required: true, default: 'Absent' },
    shift: { type: String, required: true },
    remarks: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);

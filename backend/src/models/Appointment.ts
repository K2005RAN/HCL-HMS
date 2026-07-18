import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    appointmentDate: Date;
    appointmentTime: string; // HH:mm
    type: string; // Walk-in, Scheduled, Follow-up
    status: string; // Pending, Confirmed, Completed, Cancelled
    queueNumber?: number;
    reasonForVisit: string;
}

const AppointmentSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    type: { type: String, default: 'Scheduled' },
    status: { type: String, default: 'Pending' },
    queueNumber: { type: Number },
    reasonForVisit: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);

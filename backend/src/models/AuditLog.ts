import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    details: string;
    ipAddress?: string;
}

const AuditLogSchema: Schema = new Schema({
    userId: { type: String },
    userName: { type: String },
    userRole: { type: String },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import pharmacyRoutes from './routes/pharmacyRoutes';
import labRoutes from './routes/labRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import billingRoutes from './routes/billingRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import doctorRoutes from './routes/doctorRoutes';
import patientRoutes from './routes/patientRoutes';
import { auditLogger } from './middlewares/auditMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));

// Configure CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
}));

// Routes
app.use((req, res, next) => auditLogger(req as any, res, next));
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'HCI-HMS API is running' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

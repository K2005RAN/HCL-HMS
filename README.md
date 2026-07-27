<div align="center">

  <img src="https://img.shields.io/badge/Status-Live_Demo-00C853?style=for-the-badge&logo=vercel&logoColor=white" alt="Status" />
  <img src="https://img.shields.io/badge/Security-JWT_%26_BCrypt-007ACC?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="Security" />
  <img src="https://img.shields.io/badge/Architecture-Multi--Tenant_Role_Based-6C5CE7?style=for-the-badge" alt="Architecture" />

  # 🏥 HCL-HMS
  ### **Enterprise Healthcare & Clinic Management System**
  *Engineered specifically for HeidelbergCement India*

  [🌐 **Launch Live Application**](https://hcl-hms-buof.vercel.app/) • [⚡ **Quick Start Guide**](#-getting-started) • [👨‍💻 **Developer Info**](#-developed-by)

---

</div>

## 🌟 Executive Overview

**HCL-HMS** is a high-performance, enterprise-grade clinic and hospital management platform designed to fully digitize clinical workflows across industrial operational sites for **HeidelbergCement India**. 

It establishes a real-time data bridge connecting **employees (patients), attending physicians, clinical staff, laboratory technicians, and pharmacy operators** into a unified ecosystem. By replacing traditional paper logs with role-based, real-time dashboards, HCL-HMS ensures that enterprise healthcare delivery remains fast, transparent, and compliant with audit standards.

---

## 🌐 Live Application & Enterprise Demo

The platform is fully deployed and accessible for live system evaluation:

* **🔗 Web Application:** [https://hcl-hms-buof.vercel.app/](https://hcl-hms-buof.vercel.app/)
* **⚡ Infrastructure:** Vercel (Frontend Client) & Cloud Server Architecture (Backend REST API)

### 🔐 Demo Credentials Matrix

Log in using any of the following pre-configured credentials to evaluate specific system roles and permission levels:

| Role Panel | Access Level | Demo Email / Identifier | Demo Password | Key Features Accessible |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | System-Wide | `admin@heidelberg.in` | `password123` | Global audit logs, user management, system configs |
| **Doctor** | Clinical Operations | `doctor@heidelberg.in` | `password123` | Patient EMR, instant Rx drafting, lab test requests |
| **Hospital Staff** | Administrative | `staff@heidelberg.in` | `password123` | Attendance tracking, check-ins, bulk CSV ingestion |
| **Patient / Employee** | Self-Service | `patient@heidelberg.in` | `password123` | Medical history, active prescriptions, lab downloads |

> ⚠️ *Note: These credentials are provided exclusively for demonstration and evaluation purposes.*

---

## 🏗️ System Architecture

HCL-HMS utilizes a decoupled, modern client-server architecture designed for high throughput, security, and responsive real-time data flow.

                  ┌─────────────────────────────────────────┐
                  │        React 18 + Vite Frontend         │
                  │   (Tailwind CSS, Shadcn UI, TypeScript)  │
                  └────────────────────┬────────────────────┘
                                       │
                                       │ HTTPS / REST API / JWT
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Node.js / Express API          │
                  │            (Backend Service)            │
                  └────────────────────┬────────────────────┘
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     │                                 │                                 │
     ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐│  Auth Engine     │             │  Clinical Engine │             │ Audit Log Engine ││  (JWT & BCrypt)  │             │  (EMR / Rx / Lab)│             │ (IP & Timestamp) │└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘│                                 │                                 │└─────────────────────────────────┼─────────────────────────────────┘│▼┌─────────────────────────────────────────┐│        MongoDB & Mongoose ODM           ││         (Enterprise Database)           │└─────────────────────────────────────────┘
---

## ✨ Key Platform Features

### 🔐 Multi-Role Access Control
* **Super Admin Console:** Global system control panel featuring user provisioning, role assignments, system-wide configuration, and immutable compliance logging.
* **Doctor's Workspace:** Clinical interface offering patient consultation histories, one-click electronic prescription drafting (e-Rx), and direct diagnostic test ordering.
* **Hospital Staff Portal:** Rapid check-in dashboard, physical attendance tracking, and fast lookup using Mobile Number or Employee ID.
* **Patient / Employee Self-Service:** Portal allowing employees to view personal medical logs, active medication schedules, and test results.

### ⚡ Automated Enterprise Data Sync
* **Bulk CSV Uploads:** Instantly upload hundreds of employee records simultaneously. The system automatically provisions secure patient profiles and transforms generic contractor IDs into unique system identifiers.
* **Instant Lookup:** High-speed query engine for instant patient profile retrieval in high-volume clinic settings.

### 🏥 Integrated Pharmacy & Laboratory Modules
* **Pharmacy Dashboard:** Real-time inventory monitoring, low-stock alerts, digital prescription fulfillment, and batch tracking.
* **Laboratory Dashboard:** Record diagnostic outputs and dispatch lab test results directly to both the Doctor's console and Patient portal.

### 🛡️ Ironclad Security & Audit Compliance
* **Global Audit Trail:** Every critical action (logins, prescription generation, record modifications) is logged permanently with exact timestamps, client IP addresses, and active user roles.
* **Data Protection:** Stateless JSON Web Tokens (JWT) for secure session routing and BCrypt salted password hashing.

---

## 💻 Tech Stack

<table align="center">
  <tr>
    <td align="center" width="120"><b>Layer</b></td>
    <td align="center"><b>Technologies Used</b></td>
  </tr>
  <tr>
    <td align="center"><b>Frontend</b></td>
    <td>React.js (Vite), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Lucide Icons</td>
  </tr>
  <tr>
    <td align="center"><b>Backend</b></td>
    <td>Node.js, Express.js (RESTful API)</td>
  </tr>
  <tr>
    <td align="center"><b>Database</b></td>
    <td>MongoDB, Mongoose ODM</td>
  </tr>
  <tr>
    <td align="center"><b>Security</b></td>
    <td>JSON Web Tokens (JWT), BCrypt Password Hashing, CORS Security Protocols</td>
  </tr>
</table>

---

## 🏗️ System Architecture

HCL-HMS utilizes a decoupled, modern client-server architecture designed for high throughput, security, and responsive real-time data flow.

<div align="center">
  <img src="./assets/architecture.png" alt="HCL-HMS System Architecture" width="850" />
</div>

---

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed locally:
* **Node.js** (`v18.0.0` or higher)
* **npm** or **yarn**
* **MongoDB** (Local instance or MongoDB Atlas Connection URI)
* **Git**

---

### Step 1: Clone the Repository

```bash
git clone [https://github.com/K2005RAN/HCL-HMS.git](https://github.com/K2005RAN/HCL-HMS.git)
cd HCL-HMS
Step 2: Backend SetupBash# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment configuration file
cat <<EOT> .env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
EOT

# Run backend development server
npm run dev
Step 3: Frontend SetupBash# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment configuration file
cat <<EOT> .env
VITE_API_BASE_URL=http://localhost:5000/api
EOT

# Run frontend development server
npm run dev
Open your browser and navigate to http://localhost:5173 to view the application locally.MethodEndpointAuthorizationDescriptionPOST/api/auth/loginPublicAuthenticates credentials and returns JWT tokenGET/api/patients/searchStaff / DoctorFast patient search by phone number or IDPOST/api/patients/bulk-uploadAdmin / StaffIngests CSV files and generates employee profilesPOST/api/prescriptions/createDoctorIssues new digital prescription with medicine mappingGET/api/lab/pendingLab TechFetches outstanding diagnostic laboratory ordersGET/api/audit/logsSuper AdminFetches global system event audit history👨‍💻 Developed ByKaran RaiFull-Stack Software Engineer & DeveloperGitHub: @K2005RANProject Repository: https://github.com/K2005RAN/HCL-HMS

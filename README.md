<div align="center">

# 🏥 HCL-HMS (Hospital Management System)

**A State-of-the-Art Enterprise Healthcare Platform for HeidelbergCement India**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge\&logo=node.js\&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge\&logo=mongodb\&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🌟 Overview

**HCL-HMS** is a comprehensive, highly secure, and deeply integrated clinic and hospital management platform engineered specifically for **HeidelbergCement India**. It completely digitizes the medical workflow—bridging the gap between employees (patients), clinical staff, doctors, and pharmacy/lab operations.

By replacing traditional paperwork with a rapid, intelligent, and role-based digital dashboard, HCL-HMS ensures that healthcare delivery is efficient, transparent, and completely trackable.

---

## 🌐 Live Demo

The HCL-HMS platform is deployed and available for demonstration:

**🔗 Live Application:**
https://hcl-hms-buof.vercel.app/

### 🔐 Administrator Demo Credentials

Use the following credentials to access the Administrator dashboard:

* **Email / ID:** `admin@heidelberg.in`
* **Password:** `password123`

> **Note:** These credentials are provided for demonstration purposes only.

---

## ✨ Key Features

### 🔐 Multi-Role Architecture

* **Super Admin:** Global oversight, detailed immutable audit logs, user management, and system configuration.
* **Doctor's Console:** Instant access to patient consultation history, one-click prescription drafting, and direct lab test ordering.
* **Hospital Staff:** Automated appointment scheduling, attendance tracking, and fast patient lookup via Mobile Number or Employee ID.
* **Patient / Employee Portal:** Self-service dashboard for employees to view their medical history, pending lab results, and active prescriptions.

### ⚡ Seamless Data Sync

* **Bulk CSV Uploads:** Instantly upload hundreds of employee records. The system automatically provisions secure patient profiles and maps generic contractor IDs into unique identifiers.

### 🏥 Pharmacy & Laboratory Integration

* **Pharmacy Dashboard:** Real-time medicine inventory, digital issuance of prescriptions, and stock alerts.
* **Laboratory Dashboard:** Record and dispatch lab test results directly to the Doctor's console and Patient's portal.

### 🛡️ Ironclad Security & Auditing

* **Global Audit Trail:** Every critical action (logins, prescription updates, record creations) is permanently logged with timestamps, IP addresses, and user roles.
* **JWT & BCrypt:** Industry-standard password hashing and stateless token authentication.

---

## 💻 Tech Stack

### Frontend

* **React.js (Vite)** for lightning-fast module replacement.
* **TypeScript** for strict type safety and reliability.
* **Tailwind CSS & Shadcn UI** for a stunning, responsive, and glassmorphism-inspired interface.
* **Framer Motion** for elegant micro-animations.

### Backend

* **Node.js & Express.js** providing a robust RESTful API.
* **MongoDB & Mongoose** for highly flexible, schema-driven data persistence.
* **JSON Web Tokens (JWT)** for robust route protection.

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/en/) (v18+)
* [MongoDB](https://www.mongodb.com/) (Local instance or Atlas)
* Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/K2005RAN/HCL-HMS.git
   cd HCL-HMS
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   # Create a .env file with PORT, MONGO_URI, and JWT_SECRET
   npm run dev
   ```

3. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Launch**
   Open your browser and navigate to `http://localhost:5173`.

---

## 👨‍💻 Developed By

**Karan Rai**
Connect with me on [LinkedIn](https://www.linkedin.com/in/karan-rai-a961aa292).

<div align="center">
  <br />
  <i>Internal Use Only &copy; HeidelbergCement India</i>
</div>

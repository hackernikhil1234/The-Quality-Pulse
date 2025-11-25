# The-Quality-Pulse
📘 Construction Quality Pulse — Daily QA Monitoring System

A full-stack, real-time web application to track daily construction quality assurance, site progress, QA reporting, analytics, and notifications — built using:

React.js (JSX)

TailwindCSS

Node.js

Express.js

MongoDB (Mongoose)

Socket.io (real-time updates)

🚀 Features
✅ User Roles

Admin – manage users, sites, reports, analytics

Engineer – submit QA reports + images

Viewer – read-only dashboard and analytics

🏗️ Construction Sites Module

Add, edit, delete construction sites

Assign engineers to sites

Track progress, status, start/end dates

📝 Daily QA Reports

Submit inspection details

Upload photos (Cloudinary or local storage)

Report approval workflow (Pending → Approved/Rejected)

Real-time updates via Socket.io

📊 Analytics Dashboard

Compliance percentage

Pass/Fail statistics

7-day QA trend line chart

Site-wise performance

Material failure distribution

🔔 Real-Time Notifications

Triggered on:

New report created

Report marked Fail

Admin updates report status

Displayed as:

Toast alerts

Notification panel

Live feed on Dashboard

🔐 Authentication

JWT-based login & registration

Password hashing with bcrypt

Role-based API access

Protected frontend routes

🗂️ Export Features

Export QA data to CSV or PDF

🔎 Audit Logging

Tracks:

Who changed what

Which resource

Timestamp

Stored in MongoDB.

📁 Folder Structure
project/
│
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
│
└── server/                    # Express Backend
    ├── config/
    ├── models/
    ├── controllers/
    ├── routes/
    ├── middleware/
    ├── utils/
    ├── server.js
    └── package.json

⚙️ Installation & Setup
🔧 Prerequisites

Make sure you have installed:

Node.js (v16+)

MongoDB (local or cloud)

npm or yarn

📥 Clone Repository
git clone https://github.com/YOUR_USERNAME/construction-quality-pulse.git
cd construction-quality-pulse

🖥️ Backend Setup (server/)
1️⃣ Install Dependencies
cd server
npm install

2️⃣ Create .env File
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key

# Cloudinary (optional)
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

3️⃣ Start Backend
npm run dev


Server runs at:

http://localhost:5000

🌐 Frontend Setup (client/)
1️⃣ Install Dependencies
cd client
npm install

2️⃣ Create .env File
VITE_API_URL=http://localhost:5000

3️⃣ Start Frontend
npm run dev


Frontend runs at:

http://localhost:5173

🔌 API Endpoints Overview
Auth
Method	Endpoint	Description
POST	/api/auth/register	Register user
POST	/api/auth/login	Login user
GET	/api/users/me	Get authenticated user
Sites
Method	Endpoint	Description
GET	/api/sites	List all sites
POST	/api/sites	Create site (Admin)
PUT	/api/sites/:id	Update site
DELETE	/api/sites/:id	Delete site
Reports
Method	Endpoint	Description
GET	/api/reports	Get reports
POST	/api/reports	Create report
PUT	/api/reports/:id/status	Update report status
Notifications
Method	Endpoint	Description
GET	/api/notifications	Get notifications
Analytics
Method	Endpoint	Description
GET	/api/analytics	Dashboard metrics
🧪 Testing

To run backend tests:

npm run test


Frontend tests (if configured):

npm run test

📦 Deployment
🚀 Deploy Backend (Render / Railway)

Push code to GitHub

Connect repo to Render / Railway

Add environment variables from .env

🌐 Deploy Frontend (Vercel / Netlify)

Build project:

npm run build


Upload /dist folder or connect Git repo

Set VITE_API_URL environment variable to your deployed backend URL

🤝 Contributing

Fork the repo

Create your feature branch

Commit your changes

Push to branch

Open Pull Request

📄 License

MIT License — free to use & modify.

💬 Support

If you need help or want additional features, feel free to open an issue or contact the maintainer.

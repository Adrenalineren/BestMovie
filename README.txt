README

Name: Adeline Ren
Student Number: A0302931N

=====================
DATABASE DETAILS
=====================
Database: MongoDB (Community Server)
Database Name: movie
Port: 27017

=====================
DEPLOYMENT INSTRUCTIONS
=====================
Prerequisites:
- Docker Desktop installed and running
- Node.js installed

Step 1: Start MongoDB using Docker
  docker run --name mongodb -p 27017:27017 -d mongodb/mongodb-community-server:latest

  If you see a conflict error (container name already in use), run:
  docker start mongodb

Step 2: Install server dependencies
  cd "Assn 2\server"
  npm install

Step 3: Install client dependencies
  cd "..\client"
  npm install

Step 4: Seed the database (run once only — do NOT run again after adding your own data)
  cd "..\server"
  node seed.js
  This wipes the database and loads demo data including:
    - 1 staff account  (username: admin  |  password: admin123)
    - halls, movies, and screenings for demo/testing
  WARNING: Running seed.js again will delete all data you have added.

Step 5: Start the backend server (Terminal 1)
  cd "Assn 2\server"
  node index.js

Step 6: Start the frontend client (Terminal 2)
  cd "Assn 2\client"
  npm run dev

Step 7: Open browser
  Customer frontend: http://localhost:5173
  Backend/admin routes and APIs: http://localhost:3000



=====================
EXTRA FEATURES
=====================
1. Mock download feature
   - On the screening management page, staff can click a "Download Bookings" button to download a CSV file of all bookings for that screening.
   - The CSV includes columns for booking ID, customer name, email, and seat numbers.
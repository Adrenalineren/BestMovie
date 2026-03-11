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

Step 2: Install dependencies
  cd "Assn 1"
  npm install

Step 3: Seed the staff account (run once only)
  node seed.js
  This creates the default login:
    Username: admin
    Password: admin123

Step 4: Start the server
  node index.js

Step 5: Open browser and go to:
  http://localhost:3000

=====================
EXTRA FEATURES
=====================
1. Edit Screening - staff can edit an existing screening's movie,
   hall, date and time. The overlap constraint is re-validated on edit.

2. Hall Maintenance Handling - when a hall is marked Under Maintenance,
   new screenings are blocked. Existing screenings in that hall are
   not in the list to be selected for screenings.

3. Real-time Screening Status - each screening is automatically labelled
   Upcoming, Now Showing, or Completed based on current time.

4. Extended Dashboard Stats - stat cards showing total halls in use

5. View Hall Diagram - a short cut to view hall diagram in the hall
   management page 

6. Clickable Upcoming Screenings - click on an upcoming screening to go 
   to its edit page 

7. Searching and filtering in movie and screening management pages 
   for easier navigation: 
    - Movie Management: search by title, filter by age rating and genre
    - Screening Management: search by movie title or Hall name
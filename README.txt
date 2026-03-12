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

Step 3: Seed the database (run once only — do NOT run again after adding your own data)
  node seed.js
  This wipes the database and loads demo data including:
    - 1 staff account  (username: admin  |  password: admin123)
    - 5 halls (4 active, 1 under maintenance)
    - 6 movies (with 3 leaving within 7 days)
    - 25 screenings timed relative to when you run the seed
      (2 currently playing, 4 upcoming today, 20 over next 5 days)
  WARNING: Running seed.js again will delete all data you have added.

Step 4: Start the server
  node index.js

Step 5: Open browser and go to:
  http://localhost:3000

=====================
EXTRA FEATURES
=====================
1. Edit Screening - staff can edit an existing screening's movie,
   hall, date and time. The overlap constraint is re-validated on edit.

2. Hall Maintenance Warning - when attempting to set a hall to maintenance,
   if it has upcoming screenings, a warning modal appears listing all 
   affected screenings (movie, date, time). Admin must reassign or cancel 
   these screenings first before the hall can be marked for maintenance.
   Once in maintenance, no new screenings can be scheduled in that hall.

3. Real-time Screening Status - each screening is automatically labelled
   Upcoming, Now Showing, Completed, or Leaving Cinemas based on current time.

4. Extended Dashboard Stats - stat cards showing total halls in use, and upcoming 
   screenings in the next 5 days.

5. View Hall Diagram - a short cut to view hall diagram in the hall
   management page via the "view" button.

6. Clickable Upcoming Screenings - click on an upcoming screening to go 
   to its edit page as a shortcut to edit screening details.

7. Searching and filtering in movie and screening management pages 
   for easier navigation: 
    - Movie Management: search by title, filter by age rating and genre
    - Screening Management: search by movie title or Hall name
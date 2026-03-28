const bcrypt = require('bcrypt');
const { connectToDatabase, disconnect, getCollection } = require('./lib/database');

function pad(n) { return String(n).padStart(2, '0'); }
function dateStr(d) { return d.toISOString().split('T')[0]; }
function timeStr(mins) { return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`; }
function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

async function seed() {
  await connectToDatabase();

  const staff     = getCollection('staff');
  const movies    = getCollection('movies');
  const halls     = getCollection('halls');
  const screenings = getCollection('screenings');

  // clear existing data 
  await Promise.all([
    staff.deleteMany({}),
    movies.deleteMany({}),
    halls.deleteMany({}),
    screenings.deleteMany({}),
  ]);

  // create staff
  const hashed = await bcrypt.hash('admin123', 10);
  await staff.insertOne({ username: 'admin', password: hashed });

  // create halls
  const hallResult = await halls.insertMany([
    { name: 'Hall 1', type: 'Standard',   rows: 10, columns: 12, seat: [], wheelchair: 2, status: 'active' },
    { name: 'Hall 2', type: 'Deluxe',     rows: 8,  columns: 10, seat: [], wheelchair: 2, status: 'active' },
    { name: 'Hall 3', type: 'Gold Class', rows: 5,  columns: 8,  seat: [], wheelchair: 1, status: 'active' },
    { name: 'Hall 4', type: 'IMAX',       rows: 12, columns: 15, seat: [], wheelchair: 4, status: 'active' },
    { name: 'Hall 5', type: 'Standard',   rows: 10, columns: 12, seat: [], wheelchair: 2, status: 'maintenance' },
  ]);
  const hallIds = Object.values(hallResult.insertedIds);

  // create movies
  // Dates are calculated relative to today so the dashboard is always populated
  const today = new Date();

  const movieData = [
    // leaving in 3 days
    { title: 'Harry Potter and the Sorcerer\'s Stone', 
      duration: 120, 
      ageRating: 'PG', 
      rating: 8.5, 
      price: 14.00, 
      genre: ['Action', 'Coming-of-Age'], 
      leavingOffset: 3, 
      poster: '/uploads/posters/sorcererstone.png',
      summary: "Harry Potter, an eleven-year-old orphan, discovers that he is a wizard and is invited to study at Hogwarts. Even as he escapes a dreary life and enters a world of magic, he finds trouble awaiting him."
    },
    // leaving in 5 days
    { title: 'Wuthering Heights', 
      duration: 105, 
      ageRating: 'NC16', 
      rating: 7.2, 
      price: 13.50, 
      genre: ['Action', 'Drama', 'Thriller'], 
      leavingOffset: 5, 
      poster: '/uploads/posters/wutheringheights.png',
      summary: "A dark and passionate story of love and revenge set on the Yorkshire moors."
    },
    // leaving in 7 days
    { title: 'Kiki\'s Delivery Service', 
      duration: 95, 
      ageRating: 'G', 
      rating: 7.8, 
      price: 12.00, 
      genre: ['Comedy', 'Coming-of-Age'], 
      leavingOffset: 7, 
      poster: '/uploads/posters/kiki.png',
      summary: "A young witch, on her mandatory year of independent life, finds fitting into a new community difficult while she supports herself by running a delivery service."
    },
    // longer run
    { title: 'Bride!', 
      duration: 115, 
      ageRating: 'M18', 
      rating: 8.1, 
      price: 14.50, 
      genre: ['Thriller', 'Drama'], 
      leavingOffset: 20, 
      poster: '/uploads/posters/bride.png', 
      summary: "A psychological thriller about a bride-to-be who becomes the target of a mysterious stalker, leading to a suspenseful and chilling journey to uncover the truth."
    },
     // longer run
    { title: 'Harry Potter and the Order of the Phoenix', 
      duration: 110, 
      ageRating: 'PG13', 
      rating: 7.5, 
      price: 13.00, 
      genre: ['Action', 'Coming-of-Age'], 
      leavingOffset: 30, 
      poster: '/uploads/posters/orderofphoenix.png',
      summary: "The return of Lord Voldemort brings danger to the wizarding world, and Harry Potter must face his destiny."
    },
    { title: 'Marty Supreme', 
      duration: 85,  
      ageRating: 'R21', 
      rating: 7.0, 
      price: 11.00, 
      genre: ['Drama', 'Sport'], 
      leavingOffset: 14, 
      poster: '/uploads/posters/martysupreme.png', 
      summary: "A gripping drama about a young athlete's journey to the top of his sport." 
    },
  ];

  const movieDocs = movieData.map(m => ({
    title: m.title,
    poster: m.poster || 'https://via.placeholder.com/200x300?text=No+Image',
    ageRating: m.ageRating,
    rating: m.rating,
    summary: m.summary || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    price: m.price,
    duration: m.duration,
    genre: m.genre,
    releaseDate: dateStr(addDays(today, -15)),
    leavingCinema: dateStr(addDays(today, m.leavingOffset)),
  }));

  const movieResult = await movies.insertMany(movieDocs);
  const movieIds = Object.values(movieResult.insertedIds);
  const durations = movieData.map(m => m.duration);

  // create screenings
  //  timing created based on date node seed.js
  const nowMins = today.getHours() * 60 + today.getMinutes();

  function screening(movieIdx, hallIdx, dayOffset, startMins) {
    // If start time exceeds 24h, shift to next day
    if (startMins >= 24 * 60) {
      dayOffset += 1;
      startMins -= (24 * 60);
    }
    
    if (startMins < 0) return null;
    
    const endMins = startMins + durations[movieIdx] + 30;
    // End time wraps to next day if it exceeds 24h
    const displayEndMins = endMins > 24 * 60 ? endMins - (24 * 60) : endMins;
    
    return {
      movieId: movieIds[movieIdx],
      hallId: hallIds[hallIdx],
      date: dateStr(addDays(today, dayOffset)),
      screeningTime: timeStr(startMins),
      endTime: timeStr(displayEndMins),
      status: 'Available',
    };
  }

  const screeningDocs = [];
  function add(s) { if (s) screeningDocs.push(s); }

  // TODAY — currently playing: started 40 min ago so it's mid-way through
  add(screening(0, 0, 0, nowMins - 40));   
  add(screening(3, 3, 0, nowMins - 20)); 

  // TODAY — upcoming: starting in +2h and +4h
  add(screening(1, 1, 0, nowMins + 120));  
  add(screening(2, 2, 0, nowMins + 120));  
  add(screening(4, 0, 0, nowMins + 240)); 
  add(screening(5, 1, 0, nowMins + 300));  

  // NEXT 5 DAYS — fixed screening times: 10:00, 13:00, 16:00, 19:00
  const slots = [600, 780, 960, 1140];
  for (let day = 1; day <= 5; day++) {
    add(screening( day % 6,  0, day, slots[0]));
    add(screening((day + 1) % 6,  1, day, slots[1]));
    add(screening((day + 2) % 6,  2, day, slots[2]));
    add(screening((day + 3) % 6,  3, day, slots[3]));
  }

  if (screeningDocs.length > 0) {
    await screenings.insertMany(screeningDocs);
  }

  console.log('Seeded successfully!');
  console.log(`Staff: 1 account  (username: admin  |  password: admin123)`);
  console.log(`Halls: ${hallIds.length} (4 active, 1 under maintenance)`);
  console.log(`Movies: ${movieIds.length} (3 leaving within 7 days)`);
  console.log(`Screenings:${screeningDocs.length} (2 playing now, 4 upcoming today, ${5 * 4} over next 5 days)`);

  await disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
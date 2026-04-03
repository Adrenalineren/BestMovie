// interactive cinema grid
let seatData = []; // stores all seat info
let existingSeats = []; // for editing 

function generateDiagram() {
  // get the counts of all 3 fields
  const rows = parseInt(document.getElementById('rows').value);
  const cols = parseInt(document.getElementById('cols').value);
  const wheelchair = parseInt(document.getElementById('wheelchair').value) || 0;

  if (!rows || !cols) return alert('Please enter rows and columns.');

  console.log('=== GENERATE DIAGRAM ===');
  console.log('Current seatData length before reset:', seatData.length);
  console.log('existingSeats from database:', existingSeats);
  
  // Preserve existing seat modifications (toggles) when regenerating in same session
  const previousSeatData = seatData.length > 0 ? seatData : null;
  seatData = [];
  const grid = document.getElementById('seat-grid');
  grid.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    // row labelled A, B, ...
    const rowLabel = String.fromCharCode(65 + r);
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';

    const label = document.createElement('div');
    label.className = 'row-label';
    label.textContent = rowLabel;
    rowDiv.appendChild(label);

    for (let c = 0; c < cols; c++) {
      // wheelchair only last row and last 'wheelchair' seats
      const isWheelchair = (r === rows - 1) && (c >= cols - wheelchair);
      let type = isWheelchair ? 'wheelchair' : 'normal';
      let loadedFrom = 'default';

      // Priority 1: Check if user toggled this seat IN THIS SESSION (previousSeatData)
      if (previousSeatData && previousSeatData.length > 0) {
        const toggledSeat = previousSeatData.find(s => s.row === rowLabel && s.col === c + 1);
        if (toggledSeat) {
          type = toggledSeat.type;
          loadedFrom = 'previousSession';
        }
      } 
      // Priority 2: Check database (existingSeats from loaded hall)
      else if (existingSeats && existingSeats.length > 0) {
        const dbSeat = existingSeats.find(s => s.row === rowLabel && s.col === c + 1);
        if (dbSeat) {
          // Found in database - use its exact type (normal, wheelchair, or deleted)
          type = dbSeat.type;
          loadedFrom = 'database';
        }
        // If not found in existingSeats, it means this is a new seat (use default)
      }

      seatData.push({ row: rowLabel, col: c + 1, type });

      const seat = document.createElement('button');
      seat.className = `seat ${type}`;
      seat.title = `${rowLabel}${c + 1}`;
      seat.textContent = c + 1;
      seat.dataset.row = rowLabel;
      seat.dataset.col = c + 1;
      
      seat.addEventListener('click', () => toggleSeat(seat, rowLabel, c + 1));
      seat.addEventListener('contextmenu', (e) => { e.preventDefault(); restoreSeat(seat, rowLabel, c + 1); });

      rowDiv.appendChild(seat);
    }
    grid.appendChild(rowDiv);
  }

  console.log('Diagram generated with seats:', seatData);
  console.log('Previous seat data was:', previousSeatData);
  console.log('Existing seats from DB:', existingSeats);
  document.getElementById('form-section').style.display = 'none';
  document.getElementById('diagram-section').style.display = 'block';
}

// left-click to toggle normal -> wheelchair -> deleted
function toggleSeat(btn, row, col) {
  const seatIndex = seatData.findIndex(s => s.row === row && s.col === col);
  if (seatIndex === -1) return; // Seat not found
  
  const seat = seatData[seatIndex];
  
  if (seat.type === 'deleted') return; // Can't toggle deleted seat
  
  if (seat.type === 'normal') {
    seatData[seatIndex].type = 'wheelchair';
    btn.className = 'seat wheelchair';
  } else if (seat.type === 'wheelchair') {
    seatData[seatIndex].type = 'deleted';
    btn.className = 'seat deleted';
  }
  
  console.log(`Toggled seat ${row}${col} to ${seatData[seatIndex].type}`); // Debug
}

// right-click to restore deleted -> normal
function restoreSeat(btn, row, col) {
  const seatIndex = seatData.findIndex(s => s.row === row && s.col === col);
  if (seatIndex === -1) return; // Seat not found
  
  seatData[seatIndex].type = 'normal';
  btn.className = 'seat normal';
  
  console.log(`Restored seat ${row}${col} to normal`); // Debug
}

function confirmHall() {
  const hallName = document.getElementById('hallName').value;
  
  // Validation
  if (!hallName.trim()) {
    alert('Please enter a hall name.');
    return;
  }
  
  console.log('=== CONFIRMING HALL ===');
  console.log('Hall name:', hallName);
  console.log('seatData length:', seatData.length);
  console.log('seatData:', seatData);
  console.log('Sample seats:', seatData.slice(0, 5));
  
  // Check count by type
  const normal = seatData.filter(s => s.type === 'normal').length;
  const wheelchair = seatData.filter(s => s.type === 'wheelchair').length;
  const deleted = seatData.filter(s => s.type === 'deleted').length;
  
  console.log(`Seat breakdown: ${normal} normal, ${wheelchair} wheelchair, ${deleted} deleted`);
  
  // copy values to hidden form
  document.getElementById('f-name').value = hallName;
  document.getElementById('f-type').value = document.getElementById('hallType').value;
  document.getElementById('f-rows').value = document.getElementById('rows').value;
  document.getElementById('f-cols').value = document.getElementById('cols').value;
  document.getElementById('f-wheelchair').value = document.getElementById('wheelchair').value;
  
  // Submit ALL seats including deleted ones so database knows what was deleted
  const jsonToSubmit = JSON.stringify(seatData);
  document.getElementById('f-seats').value = jsonToSubmit;
  
  console.log('JSON string length:', jsonToSubmit.length);
  console.log('First 200 chars of JSON:', jsonToSubmit.substring(0, 200));
  console.log('Hidden form values:');
  console.log('  f-name:', document.getElementById('f-name').value);
  console.log('  f-type:', document.getElementById('f-type').value);
  console.log('  f-rows:', document.getElementById('f-rows').value);
  console.log('  f-cols:', document.getElementById('f-cols').value);
  console.log('  f-wheelchair:', document.getElementById('f-wheelchair').value);
  console.log('  f-seats length:', document.getElementById('f-seats').value.length);
  
  console.log('=== SUBMITTING FORM NOW ===');
  
  // Submit the form after a short delay so console logs are visible
  setTimeout(() => {
    document.getElementById('confirmForm').submit();
  }, 1000);
}

function goBack() {
  document.getElementById('form-section').style.display = 'block'; // show form
  document.getElementById('diagram-section').style.display = 'none'; // hide grid
}

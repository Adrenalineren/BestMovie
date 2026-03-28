// interactive cinema grid
let seatData = []; // stores all seat info
let existingSeats = []; // for editing 

function generateDiagram() {
  // get the counts of all 3 fields
  const rows = parseInt(document.getElementById('rows').value);
  const cols = parseInt(document.getElementById('cols').value);
  const wheelchair = parseInt(document.getElementById('wheelchair').value) || 0;

  if (!rows || !cols) return alert('Please enter rows and columns.');

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
      const type = isWheelchair ? 'wheelchair' : 'normal';

      seatData.push({ row: rowLabel, col: c + 1, type });

      const seat = document.createElement('button');
      seat.className = `seat ${type}`;
      seat.title = `${rowLabel}${c + 1}`;
      seat.textContent = c + 1; // display column number on seat
      seat.dataset.row = rowLabel; // store data for later use
      seat.dataset.col = c + 1;
      // adding right click left click
      seat.addEventListener('click', () => toggleSeat(seat, rowLabel, c + 1)); // left click to toggle 
      seat.addEventListener('contextmenu', (e) => { e.preventDefault(); restoreSeat(seat, rowLabel, c + 1); }); // right click

      rowDiv.appendChild(seat);
    }
    grid.appendChild(rowDiv);
  }

  document.getElementById('form-section').style.display = 'none'; // hide form
  document.getElementById('diagram-section').style.display = 'block'; // show grid
}

// left-click to toggle normal -> wheelchair -> deleted
function toggleSeat(btn, row, col) {
  const seat = seatData.find(s => s.row === row && s.col === col);
  if (!seat || seat.type === 'deleted') return;
  if (seat.type === 'normal') {
    seat.type = 'wheelchair';
    btn.className = 'seat wheelchair';
  } else if (seat.type === 'wheelchair') {
    seat.type = 'deleted';
    btn.className = 'seat deleted';
  }
}
// right-click to restore deleted -> normal
function restoreSeat(btn, row, col) {
  const seat = seatData.find(s => s.row === row && s.col === col);
  if (!seat) return;
  seat.type = 'normal';
  btn.className = 'seat normal';
}

function confirmHall() {
  const hallName = document.getElementById('hallName').value;
  
  // Validation
  if (!hallName.trim()) {
    alert('Please enter a hall name.');
    return;
  }
  
  // copy values to hidden form
  document.getElementById('f-name').value = hallName;
  document.getElementById('f-type').value = document.getElementById('hallType').value;
  document.getElementById('f-rows').value = document.getElementById('rows').value;
  document.getElementById('f-cols').value = document.getElementById('cols').value;
  document.getElementById('f-wheelchair').value = document.getElementById('wheelchair').value;
  // if no changes to seats, use existing seats (for edit), else use new seat data
  const seatsToSubmit = seatData.filter(s => s.type !== 'deleted').length > 0 ? seatData.filter(s => s.type !== 'deleted') : existingSeats;
  document.getElementById('f-seats').value = JSON.stringify(seatsToSubmit);
  
  // Submit the form directly
  document.getElementById('confirmForm').submit();
}

function goBack() {
  document.getElementById('form-section').style.display = 'block'; // show form
  document.getElementById('diagram-section').style.display = 'none'; // hide grid
}

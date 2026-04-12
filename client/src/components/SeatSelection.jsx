import { useState, useEffect } from 'react';
import '../assets/SeatSelection.css';
import { useNavigate } from 'react-router-dom';
function SeatSelection({ screening, movieTitle, moviePrice, onClose, onSelectSeats }) {
    const navigate = useNavigate();
    const [hall, setHall] = useState(null);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch hall details
        fetch(`http://localhost:3000/api/halls/${screening.hallId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Hall data received:', data);
                setHall(data);
            })
            .catch(err => console.error('Error fetching hall:', err));

        // Fetch booked seats for this screening
        fetch(`http://localhost:3000/api/bookings/screening/${screening._id}`)
            .then(res => res.json())
            .then(data => {
                console.log('Booked seats data received:', data);
                setBookedSeats(data.bookedSeats || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching bookings:', err);
                setLoading(false);
            });
    }, [screening._id, screening.hallId]);

    const isSeatBooked = (seatIndex) => {
        // Convert seat index to label (e.g., 0 => "A1", 5 => "A6")
        if (seats && seats[seatIndex]) {
            const seat = seats[seatIndex];
            const seatLabel = `${seat.row}${seat.col}`;
            return bookedSeats.includes(seatLabel);
        }
        return false;
    };

    const isSeatSelected = (seatIndex) => {
        return selectedSeats.includes(seatIndex);
    };

    const toggleSeatSelection = (seatIndex, seatType) => {
        // Can't select disabled or wheelchair seats
        if (seatType === 'deleted' || seatType === 'wheelchair') return;
        // Can't select booked seats
        if (isSeatBooked(seatIndex)) return;

        setSelectedSeats(prev => {
            if (prev.includes(seatIndex)) {
                return prev.filter(s => s !== seatIndex);
            } else {
                return [...prev, seatIndex];
            }
        });
    };

    const handleConfirmSelection = () => {
        if (selectedSeats.length > 0) {
            onSelectSeats(selectedSeats, hall);
            
            // Navigate to checkout with seat data
            navigate('/checkout', { 
                state: { 
                    selectedSeats: selectedSeats.map(idx => `${seats[idx].row}${seats[idx].col}`),
                    screening: screening,
                    movieTitle: movieTitle,
                    hall: hall,
                    moviePrice: moviePrice
                }
            });
        }
    };

    if (loading || !hall) {
        return <div className="seat-selection-loading">Loading seating diagram...</div>;
    }

    // If seat array is empty, generate it from rows/columns
    let seats = hall.seat && hall.seat.length > 0 ? hall.seat : [];
    
    if (seats.length === 0 && hall.rows && hall.columns) {
        console.warn('Seat array empty for hall, generating from rows/columns');
        const generatedSeats = [];
        for (let r = 0; r < hall.rows; r++) {
            const rowLabel = String.fromCharCode(65 + r); // A, B, C, ...
            for (let c = 1; c <= hall.columns; c++) {
                // Mark last few seats of last row as wheelchair if hall has wheelchair count
                const wheelchairCount = hall.wheelchair || 0;
                const isWheelchair = (r === hall.rows - 1) && (c > hall.columns - wheelchairCount);
                
                generatedSeats.push({
                    row: rowLabel,
                    col: c,
                    type: isWheelchair ? 'wheelchair' : 'normal'
                });
            }
        }
        seats = generatedSeats;
        console.log('Generated seats:', generatedSeats.length);
    }
    
    // Debug: check if seats exist
    if (!seats || seats.length === 0) {
        console.error('No seats found in hall:', hall);
        return (
            <div className="seat-selection-overlay" onClick={onClose}>
                <div className="seat-selection-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="seat-selection-header">
                        <h2>{movieTitle} - {hall.name}</h2>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                    <div style={{ padding: '20px', color: '#ccc' }}>
                        <p>Error: No seating configuration found for this hall.</p>
                        <p>Hall ID: {screening.hallId}</p>
                        <p>Hall data: {JSON.stringify(hall, null, 2)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="seat-selection-overlay" onClick={onClose}>
            <div className="seat-selection-modal" onClick={(e) => e.stopPropagation()}>
                <div className="seat-selection-header">
                    <h2>{movieTitle} - {hall.name}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="seat-selection-content">
                    {/* Screen */}
                    <div className="screen">SCREEN</div>

                    {/* Seating Grid */}
                    <div className="seating-grid">
                        {seats && (() => {
                            // Group seats by row letter
                            const rows = {};
                            seats.forEach((seat, index) => {
                                if (!rows[seat.row]) rows[seat.row] = [];
                                rows[seat.row].push({ ...seat, index });
                            });

                            // Render each row
                            return Object.keys(rows).sort().map((rowLetter) => (
                                <div key={rowLetter} className="seat-row">
                                    <div className="row-label">{rowLetter}</div>
                                    {rows[rowLetter].map(({ col, type, index }) => {
                                        const isBooked = isSeatBooked(index);
                                        const isSelected = isSeatSelected(index);
                                        const isDisabled = type === 'deleted';
                                        const isWheelchair = type === 'wheelchair';
                                        const isAvailable = !isBooked && !isDisabled && !isWheelchair;

                                        let seatClass = 'seat';
                                        if (isDisabled) seatClass += ' disabled';
                                        else if (isWheelchair) seatClass += ' wheelchair';
                                        else if (isBooked) seatClass += ' booked';
                                        else if (isSelected) seatClass += ' selected';
                                        else if (isAvailable) seatClass += ' available';

                                        return (
                                            <button
                                                key={`${rowLetter}-${col}`}
                                                className={seatClass}
                                                onClick={() => toggleSeatSelection(index, type)}
                                                disabled={isDisabled || isWheelchair || isBooked}
                                                title={
                                                    isDisabled ? 'Disabled' :
                                                    isWheelchair ? 'Wheelchair accessible' :
                                                    isBooked ? 'Already booked' :
                                                    `Seat ${rowLetter}${col}`
                                                }
                                            >
                                                {isWheelchair ? '♿' : isDisabled ? '✕' : col}
                                            </button>
                                        );
                                    })}
                                </div>
                            ));
                        })()}
                    </div>

                    {/* Legend */}
                    <div className="seat-legend">
                        <div className="legend-item">
                            <div className="legend-seat available"></div>
                            <span>Available</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-seat selected"></div>
                            <span>Selected</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-seat booked"></div>
                            <span>Booked</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-seat wheelchair"></div>
                            <span>Wheelchair</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-seat disabled"></div>
                            <span>Disabled</span>
                        </div>
                    </div>

                    {/* Selection Summary */}
                    <div className="selection-summary">
                        <p>Selected Seats: {selectedSeats.length > 0 ? selectedSeats.map(idx => `${seats[idx].row}${seats[idx].col}`).join(', ') : 'None'}</p>
                    </div>

                    {/* Actions */}
                    <div className="seat-selection-actions">
                        <button className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button 
                            className="btn-confirm" 
                            onClick={handleConfirmSelection}
                            disabled={selectedSeats.length === 0}
                        >
                            Confirm Selection ({selectedSeats.length})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SeatSelection;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/MyTickets.css';

export default function MyTickets() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [cancelledBookings, setCancelledBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [customer, setCustomer] = useState(null);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('accessToken');
        const customerData = localStorage.getItem('customer');

        if (!token || !customerData) {
            navigate('/');
            return;
        }

        setCustomer(JSON.parse(customerData));
        fetchBookings(token);
    }, [navigate]);

    const fetchBookings = async (token) => {
        try {
            const response = await fetch('http://localhost:3000/api/bookings/search', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to fetch bookings');
                setBookings([]);
                setCancelledBookings([]);
            } else {
                const allBookings = data.bookings || [];
                const activeBookings = allBookings.filter((booking) => (booking.status || 'confirmed').toLowerCase() !== 'cancelled');
                const cancelled = allBookings.filter((booking) => (booking.status || '').toLowerCase() === 'cancelled');

                setBookings(activeBookings);
                setCancelledBookings(cancelled);
                setError('');
            }
        } catch (err) {
            setError('Error fetching bookings: ' + err.message);
            setBookings([]);
            setCancelledBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-SG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        return timeStr;
    };

    const getScreeningDateTime = (booking) => {
        if (!booking?.screeningDate) return Number.MAX_SAFE_INTEGER;

        const withTime = `${booking.screeningDate}T${booking.screeningTime || '00:00'}`;
        const parsed = new Date(withTime).getTime();

        if (Number.isNaN(parsed)) {
            const dateOnly = new Date(booking.screeningDate).getTime();
            return Number.isNaN(dateOnly) ? Number.MAX_SAFE_INTEGER : dateOnly;
        }

        return parsed;
    };

    const sortedBookings = [...bookings].sort((a, b) => getScreeningDateTime(a) - getScreeningDateTime(b));
    const hasCancelledBookings = cancelledBookings.length > 0;

    if (loading) {
        return (
            <div className="my-tickets-container">
                <div className="my-tickets-content">
                    <div className="loading-spinner">Loading your tickets...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-tickets-container">
            <div className="my-tickets-content">

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {hasCancelledBookings && (
                    <div className="cancellation-notice" role="status" aria-live="polite">
                        <div className="cancellation-notice-title">✓ Refund Processed</div>
                        <p>
                            {cancelledBookings.length} booking{cancelledBookings.length > 1 ? 's were' : ' was'} cancelled and refunded because the hall entered maintenance.
                        </p>
                        <div className="cancellation-list">
                            {cancelledBookings.map((booking) => (
                                <div key={booking._id} className="cancellation-item">
                                    <strong>{booking.movieTitle}</strong>
                                    <span>
                                        {booking.screeningDate ? formatDate(booking.screeningDate) : 'Screening date unavailable'}
                                        {booking.screeningTime ? `, ${booking.screeningTime}` : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Back Button */}
                <div className="back-to-home">
                    <button className="back-home-btn" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>
                </div>

                {/* Results */}
                {bookings.length === 0 ? (
                    <div className="no-bookings">
                        <p>{hasCancelledBookings ? 'Your active tickets are no longer available.' : "You don't have any bookings yet."}</p>
                        <p className="hint">
                            {hasCancelledBookings ? 'The cancellation notice above lists the screenings that were removed.' : 'Start booking your favorite movies now!'}
                        </p>
                        <button 
                            className="browse-btn"
                            onClick={() => navigate('/')}
                        >
                            Browse Movies
                        </button>
                    </div>
                ) : (
                    <div className="bookings-grid">
                        <h2 className="results-title">Your Bookings ({bookings.length})</h2>
                        
                        <div className="bookings-summary-list">
                            {sortedBookings.map((booking) => (
                                <div key={booking._id} className="booking-summary-row">
                                    <div className="summary-primary">
                                        <p className="summary-date">Screening: {formatDate(booking.screeningDate)}, {formatTime(booking.screeningTime)}</p>
                                        <p className="summary-movie">{booking.movieTitle}</p>
                                    </div>
                                    <div className="summary-secondary">
                                        <p className="summary-seats">{booking.seats.length} x{booking.seats.length > 1 ? 's' : ''}</p>
                                        <button
                                            className="view-details-btn"
                                            onClick={() => navigate('/booking-details', {
                                                state: {
                                                    booking,
                                                    bookingId: booking._id?.toString?.() || booking._id
                                                }
                                            })}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

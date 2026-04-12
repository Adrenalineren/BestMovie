import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/MyTickets.css';

export default function MyTickets() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
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
            } else {
                setBookings(data.bookings || []);
                setError('');
            }
        } catch (err) {
            setError('Error fetching bookings: ' + err.message);
            setBookings([]);
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
                {/* Back Button */}
                <div className="back-to-home">
                    <button className="back-home-btn" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>
                </div>

                {/* Results */}
                {bookings.length === 0 ? (
                    <div className="no-bookings">
                        <p>You don't have any bookings yet.</p>
                        <p className="hint">Start booking your favorite movies now!</p>
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

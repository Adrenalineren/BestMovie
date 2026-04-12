import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/OrderConfirmation.css';

export default function BookingDeets() {
    const location = useLocation();
    const navigate = useNavigate();

    if (!location.state?.booking) {
        return (
            <div className="confirmation-error">
                <h1>No Booking Found</h1>
                <p>Open a booking from My Tickets to view details.</p>
                <button className="btn-home" onClick={() => navigate('/my-tickets')}>Back to My Tickets</button>
            </div>
        );
    }

    const { booking } = location.state;
    const bookingId = location.state.bookingId || booking._id;
    const { movieTitle, hallName, seats, moviePrice, totalAmount, paymentMethod, createdAt } = booking;

    const formattedDate = new Date(createdAt).toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const paymentMethodDisplay = {
        card: 'Credit & Debit Card',
        paynow: 'PayNow'
    }[paymentMethod] || paymentMethod;

    return (
        <div className="confirmation-page">
            <div className="confirmation-container">
                <div className="confirmation-actions">
                    <button className="btn-home btn-back-home" onClick={() => navigate('/my-tickets')}>
                        ← Back to My Tickets
                    </button>
                </div>

                <div className="success-header">
                    <h1>Booking Details</h1>
                </div>

                <div className="order-summary-card receipt-card">
                    <div className="receipt-header-row">
                        <div>
                            <p className="receipt-brand">CineVillage</p>
                            <p className="receipt-subtitle">Official Receipt</p>
                        </div>
                        <p className="confirmation-id">#{bookingId}</p>
                    </div>

                    <div className="order-section">
                        <div className="order-row">
                            <span className="label">Date of Purchase:</span>
                            <span className="value">{formattedDate}</span>
                        </div>
                        <div className="order-row">
                            <span className="label">Movie:</span>
                            <span className="value">{movieTitle}</span>
                        </div>
                        <div className="order-row">
                            <span className="label">Hall:</span>
                            <span className="value">{hallName}</span>
                        </div>
                        <div className="order-row">
                            <span className="label">Seats:</span>
                            <span className="value seats-list">{seats.join(', ')}</span>
                        </div>
                    </div>

                    <div className="order-section">
                        <h3 className="breakdown-title">Price Breakdown</h3>
                        <table className="price-breakdown">
                            <tbody>
                                <tr>
                                    <td className="desc">Ticket Price ({seats.length} x S${moviePrice})</td>
                                    <td className="amount">S$ {(seats.length * moviePrice).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="desc">Convenience Fee</td>
                                    <td className="amount">S$ 2.00</td>
                                </tr>
                                <tr className="total-row">
                                    <td className="desc">Total Amount</td>
                                    <td className="amount">S$ {totalAmount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="order-section">
                        <div className="order-row">
                            <span className="label">Payment Method:</span>
                            <span className="value">{paymentMethodDisplay}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

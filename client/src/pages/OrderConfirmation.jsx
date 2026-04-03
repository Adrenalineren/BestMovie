import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/OrderConfirmation.css';

export default function OrderConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();

    // If no booking data, redirect back
    if (!location.state?.booking) {
        return (
            <div className="confirmation-error">
                <h1>No Booking Found</h1>
                <p>Unable to display order confirmation.</p>
                <button className="btn-home" onClick={() => navigate('/')}>Go to Home</button>
            </div>
        );
    }

    const { booking, bookingId } = location.state;
    const { movieTitle, hallName, seats, moviePrice, totalAmount, paymentMethod, createdAt } = booking;

    const formattedDate = new Date(createdAt).toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const paymentMethodDisplay = {
        'card': 'Credit & Debit Card',
        'paynow': 'PayNow'
    }[paymentMethod] || paymentMethod;

    return (
        <div className="confirmation-page">
            <div className="confirmation-container">
                {/* Success Header */}
                <div className="success-header">
                    <div className="success-icon">✓</div>
                    <h1>Booking Confirmed!</h1>
                    <p className="confirmation-id">Confirmation ID: <strong>{bookingId}</strong></p>
                </div>

                {/* Order Summary Card */}
                <div className="order-summary-card">
                    <h2>Order Summary</h2>
                    
                    {/* Movie & Hall Info */}
                    <div className="order-section">
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

                    {/* Price Breakdown */}
                    <div className="order-section">
                        <h3 className="breakdown-title">Price Breakdown</h3>
                        <table className="price-breakdown">
                            <tbody>
                                <tr>
                                    <td className="desc">Ticket Price ({seats.length} × S${moviePrice})</td>
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

                    {/* Payment Info */}
                    <div className="order-section">
                        <div className="order-row">
                            <span className="label">Payment Method:</span>
                            <span className="value">{paymentMethodDisplay}</span>
                        </div>
                        <div className="order-row">
                            <span className="label">Order Date & Time:</span>
                            <span className="value">{formattedDate}</span>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="order-status">
                        <span className="status-badge confirmed">Confirmed</span>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="important-notes">
                    <h3>Important Information</h3>
                    <ul>
                        <li>Please arrive 15 minutes before the screening time</li>
                        <li>Your tickets will be emailed to your registered email address</li>
                        <li>You can view your booking details anytime using your confirmation ID</li>
                        <li>For cancellations or changes, contact us at least 2 hours before screening</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="confirmation-actions">
                    <button className="btn-home" onClick={() => navigate('/')}>
                        Back to Home
                    </button>
                    <button className="btn-view-ticket" onClick={() => alert('Ticket download feature coming soon!')}>
                        Download Ticket
                    </button>
                </div>
            </div>
        </div>
    );
}

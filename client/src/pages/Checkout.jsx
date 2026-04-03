import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/Checkout.css';
import { useState } from 'react';

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedPayment, setSelectedPayment] = useState(null);

    // If no seat data, user came here by accident - send them back
    if (!location.state) {
        return (
            <div className="checkout-error">
                <h1>No Booking Data</h1>
                <p>Please select seats first!</p>
                <button className="btn-back" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    const { selectedSeats, screening, movieTitle, hall, moviePrice } = location.state;
    
    // Use price from state (passed from SeatSelection), default to 15 if not provided
    const pricePerSeat = moviePrice || 15;
    const ticketTotal = selectedSeats.length * pricePerSeat;
    const convenienceFee = 2.00; // Fixed convenience fee
    const grandTotal = ticketTotal + convenienceFee;

    const paymentMethods = [
        { 
            id: 'card', 
            name: 'Credit & Debit Card', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/><path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>
        },
        { 
            id: 'paynow', 
            name: 'PayNow', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bank" viewBox="0 0 16 16"><path d="m8 0 6.61 3h.89a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H15v7a.5.5 0 0 1 .485.38l.5 2a.498.498 0 0 1-.485.62H.5a.498.498 0 0 1-.485-.62l.5-2A.5.5 0 0 1 1 13V6H.5a.5.5 0 0 1-.5-.5v-2A.5.5 0 0 1 .5 3h.89zM3.777 3h8.447L8 1zM2 6v7h1V6zm2 0v7h2.5V6zm3.5 0v7h1V6zm2 0v7H12V6zM13 6v7h1V6zm2-1V4H1v1zm-.39 9H1.39l-.25 1h13.72z"/></svg>
        }
    ];

    const handleProceed = async () => {
        if (!selectedPayment) {
            alert('Please select a payment method');
            return;
        }

        try {
            console.log('📤 Sending booking request with:', {
                screeningId: screening._id,
                seatsToBook: selectedSeats,
                paymentMethod: selectedPayment,
                movieTitle,
                hallName: hall.name,
                moviePrice
            });

            // Send booking to backend
            const response = await fetch('http://localhost:3000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    screeningId: screening._id,
                    seatsToBook: selectedSeats,
                    paymentMethod: selectedPayment,
                    movieTitle,
                    hallName: hall.name,
                    moviePrice
                }),
                credentials: 'include' // Include session cookies if user is logged in
            });

            console.log('📥 Response status:', response.status);

            const data = await response.json();
            console.log('📦 Response data:', data);

            if (!response.ok || !data.success) {
                // Seats no longer available (race condition detected)
                alert(`❌ ${data.error || 'Booking failed'}\n\nPlease go back and select different seats.`);
                navigate(-1);
                return;
            }
            // SUCCESS - Booking confirmed! Navigate to confirmation page
            navigate('/confirmation', {
                state: {
                    booking: data.booking,
                    bookingId: data.bookingId
                }
            });
            
        } catch (error) {
            console.error(' Booking error details:', error);
            alert(`Error processing booking:\n${error.message}\n\nMake sure the server is running on http://localhost:3000`);
        }
    };
    
    return (
        <div className="checkout-container">
            {/* Ticket Price Section */}
            <div className="checkout-section">
                <h2 className="section-title">Checkout summary</h2>
                
            </div>

            {/* Price Breakdown Table */}
            <div className="checkout-section">
                <table className="price-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Ticket Price</th>
                            <th>Qty</th>
                            <th>Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{movieTitle}</td>
                            <td>S$ {pricePerSeat.toFixed(2)}</td>
                            <td>{selectedSeats.length}</td>
                            <td>S$ {ticketTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Convenience Fee</td>
                            <td>-</td>
                            <td>1</td>
                            <td>S$ {convenienceFee.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Selected Seats */}
            <div className="checkout-section">
                <p><strong>Hall:</strong> {hall?.name}</p>
                <p><strong>Selected Seats:</strong> {selectedSeats.join(', ')}</p>
            </div>

            {/* Grand Total */}
            <div className="checkout-section grand-total-section">
                <h3>Grand Total: S$ {grandTotal.toFixed(2)}</h3>
            </div>

            {/* Payment Method Section */}
            <div className="checkout-section">
                <h2 className="section-title">Payment Method</h2>
                <p className="payment-instruction">Please select payment method</p>
                
                <div className="payment-methods">
                    {paymentMethods.map(method => (
                        <label key={method.id} className="payment-option">
                            <input
                                type="radio"
                                name="payment"
                                value={method.id}
                                checked={selectedPayment === method.id}
                                onChange={(e) => setSelectedPayment(e.target.value)}
                            />
                            <div className="payment-card">
                                {method.icon}
                                <p>{method.name}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="checkout-actions">
                <button 
                    className="btn-back"
                    onClick={() => navigate(-1)}
                >
                    Back
                </button>
                <button 
                    className="btn-proceed"
                    onClick={handleProceed}
                    disabled={!selectedPayment}
                >
                    Book
                </button>
            </div>
        </div>
    );
}
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

        const handleDownloadReceipt = () => {
                const receiptDate = new Date(createdAt).toLocaleString('en-SG');
                const subtotal = (seats.length * moviePrice).toFixed(2);
                const receiptHtml = `<!doctype html> <!-- Generated receipt for booking ${bookingId} -->
<html>
<head>
    <meta charset="utf-8" />
    <title>CineVillage Receipt ${bookingId}</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #f4f4f4; padding: 24px; }
        .receipt { max-width: 420px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #ddd; }
        .center { text-align: center; }
        .line { border-top: 1px dashed #999; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; gap: 16px; margin: 4px 0; }
        .muted { color: #666; }
        .total { font-weight: 700; font-size: 16px; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="center"><h2 style="margin: 0;">CineVillage</h2></div>
        <div class="center muted" style="margin-top: 4px;">Official Receipt</div>
        <div class="line"></div>
        <div class="row"><span>Confirmation</span><span>${bookingId}</span></div>
        <div class="row"><span>Date of Purchase</span><span>${receiptDate}</span></div>
        <div class="row"><span>Movie</span><span>${movieTitle}</span></div>
        <div class="row"><span>Hall</span><span>${hallName}</span></div>
        <div class="row"><span>Seats</span><span>${seats.join(', ')}</span></div>
        <div class="line"></div>
        <div class="row"><span>Ticket Price (${seats.length} x S$${moviePrice})</span><span>S$${subtotal}</span></div>
        <div class="row"><span>Convenience Fee</span><span>S$2.00</span></div>
        <div class="row total"><span>Total</span><span>S$${totalAmount.toFixed(2)}</span></div>
        <div class="line"></div>
        <div class="row"><span>Payment Method</span><span>${paymentMethodDisplay}</span></div>
    </div>
</body>
</html>`;

                const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' }); // turns HTML string into file-like object - downloadable object (Blob is raw file data in memory)
                const url = URL.createObjectURL(blob); // creates a temporary URL that points to the Blob object in memory - allows us to download it without needing a server endpoint
                const anchor = document.createElement('a'); // creates an invisible download link and clicks it to trigger the download
                anchor.href = url; 
                anchor.download = `CineVillage-Receipt-${bookingId}.html`; // sets the filename for the downloaded receipt
                document.body.appendChild(anchor); // trigger download by simulating a click on the anchor element
                anchor.click(); // cleanup - remove the anchor element and revoke the object URL to free up memory
                anchor.remove(); // URL.revokeObjectURL is used to release the memory allocated for the Blob URL after the download is triggered, preventing memory leaks in the browser
                URL.revokeObjectURL(url); // revoke the object URL to free up memory
        };

    return (
        <div className="confirmation-page">
            <div className="confirmation-container">
                <div className="confirmation-actions">
                    <button className="btn-home btn-back-home" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>
                    <button className="btn-download" onClick={handleDownloadReceipt}>
                        Download Receipt
                    </button>
                </div>

                <div className="success-header">
                    <div className="success-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" fill="currentColor" className="bi bi-check" viewBox="0 0 16 16">
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                    </div>
                    <h1>Booking Confirmed</h1>
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

                    <div className="order-section">
                        <div className="order-row">
                            <span className="label">Payment Method:</span>
                            <span className="value">{paymentMethodDisplay}</span>
                        </div>
                    </div>

                    <div className="order-status">
                        <span className="status-badge confirmed">Confirmed</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

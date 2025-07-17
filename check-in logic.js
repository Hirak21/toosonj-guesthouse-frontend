// --- CONFIGURATION ---
const API_BASE_URL = 'https://api.toosonj-guesthouse.com/v1'; // Mock API endpoint
const INVOICE_API_URL = 'https://api.invoice-system.com/v1/generate'; // Mock Invoice API
const INVOICE_API_TOKEN = 'Bearer sk_live_mock_invoice_api_token'; // Mock API Token

// --- STATE ---
let currentBookingData = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const bookingId = localStorage.getItem('lastBookingId'); // Fallback

    if (token) {
        loadBookingInfo(token, 'token');
    } else if (bookingId) {
        // This provides a fallback if the user navigates directly
        showError('No secure token found. Please use the link from your email.', true);
        document.getElementById('booking_id_manual').value = bookingId;
    } else {
        showError('No booking information found. Please use the link sent to your email or enter your Booking ID.', true);
    }
    
    document.getElementById('checkin-form').addEventListener('submit', handleCheckinSubmit);
});

function loadBookingManually() {
    const bookingId = document.getElementById('booking_id_manual').value.trim();
    if (bookingId) {
        loadBookingInfo(bookingId, 'id');
    }
}

/**
 * Loads booking information from the backend using a token or ID.
 * @param {string} identifier - The booking token or ID.
 * @param {string} type - 'token' or 'id'.
 */
async function loadBookingInfo(identifier, type) {
    showLoading(true);
    hideError();

    try {
        // MOCK API Call
        console.log(`Fetching booking with ${type}: ${identifier}`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

        // This response would come from your secure backend
        const mockApiResponse = {
            success: true,
            booking: {
                bookingId: `TGH-${identifier.slice(-6)}`,
                checkin: "2025-08-10",
                checkout: "2025-08-12",
                duration: 2,
                guest: { name: "John Doe", email: "john.doe@example.com", phone: "9876543210" },
                rooms: { deluxe: { quantity: 1 }, standard: { quantity: 0 } },
                payment: { totalAmount: 2998, amountPaid: 699, method: "CASH" }
            }
        };

        if (!mockApiResponse.success) {
            throw new Error('Invalid or expired booking identifier.');
        }

        currentBookingData = mockApiResponse.booking;
        displayBookingInfo(currentBookingData);
        showMainContent();

    } catch (error) {
        showError(error.message, true);
    } finally {
        showLoading(false);
    }
}

function displayBookingInfo(data) {
    let roomDetails = '';
    if (data.rooms.deluxe.quantity > 0) roomDetails += `${data.rooms.deluxe.quantity} x Deluxe Room `;
    if (data.rooms.standard.quantity > 0) roomDetails += `${data.rooms.standard.quantity} x Standard Room`;
    
    const balanceDue = data.payment.totalAmount - data.payment.amountPaid;

    const infoHTML = `
        <h4 class="text-lg font-bold text-gray-800 mb-4">Welcome, ${data.guest.name}!</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Room(s):</strong> ${roomDetails.trim()}</p>
            <p><strong>Check-in:</strong> ${formatDate(new Date(data.checkin))}</p>
            <p><strong>Check-out:</strong> ${formatDate(new Date(data.checkout))}</p>
            <p><strong>Total Paid:</strong> ₹${data.payment.amountPaid.toLocaleString()}</p>
            <p><strong>Balance Due:</strong> ₹${balanceDue.toLocaleString()}</p>
        </div>
    `;
    document.getElementById('booking-info').innerHTML = infoHTML;
}

async function handleCheckinSubmit(event) {
    event.preventDefault();
    showLoading(true, 'Completing check-in...');
    hideMainContent();

    const checkinDetails = {
        id_proof_type: document.getElementById('id_proof_type').value,
        id_proof_number: document.getElementById('id_proof_number').value.trim(),
        address: document.getElementById('address').value.trim(),
    };

    if (!checkinDetails.id_proof_number || !checkinDetails.address) {
        showError('Please fill all the required fields.');
        showMainContent();
        showLoading(false);
        return;
    }
    
    // --- MOCK API CALL to Invoice System ---
    const invoicePayload = {
        customer_details: currentBookingData.guest,
        booking_details: {
            id: currentBookingData.bookingId,
            ...currentBookingData.rooms,
            duration: currentBookingData.duration
        },
        checkin_verification: checkinDetails,
        payment_summary: currentBookingData.payment
    };

    try {
        console.log("Sending data to invoice system:", invoicePayload);
        // const response = await fetch(INVOICE_API_URL, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': INVOICE_API_TOKEN
        //     },
        //     body: JSON.stringify(invoicePayload)
        // });
        // const result = await response.json();
        // if (!response.ok) throw new Error(result.error);

        // Mocking the above API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockInvoiceResponse = { success: true, invoiceId: `INV-${Date.now()}`, assignedRooms: ['D101'] };
        console.log("Invoice system response:", mockInvoiceResponse);

        // Show final success message
        document.getElementById('room-number').textContent = mockInvoiceResponse.assignedRooms.join(', ');
        showSuccess();
        localStorage.removeItem('lastBookingId');
        localStorage.removeItem('lastCheckinToken');

    } catch (error) {
        showError(`Failed to complete check-in: ${error.message}`);
        showMainContent();
    } finally {
        showLoading(false);
    }
}


// --- UI HELPER FUNCTIONS ---

function showLoading(isLoading, message = 'Loading your booking details...') {
    const loader = document.getElementById('loading-container');
    loader.querySelector('p').textContent = message;
    loader.style.display = isLoading ? 'block' : 'none';
}

function showError(message, showManualEntry = false) {
    const errorContainer = document.getElementById('error-container');
    document.getElementById('error-message').textContent = message;
    errorContainer.classList.remove('hidden');
    if (!showManualEntry) {
        errorContainer.querySelector('#booking_id_manual').parentElement.style.display = 'none';
    }
}

function hideError() {
    document.getElementById('error-container').classList.add('hidden');
}

function showMainContent() {
    document.getElementById('checkin-content').classList.remove('hidden');
}

function hideMainContent() {
    document.getElementById('checkin-content').classList.add('hidden');
}

function showSuccess() {
    document.getElementById('success-container').classList.remove('hidden');
}

function formatDate(date) {
    return date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

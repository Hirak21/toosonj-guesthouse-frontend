// --- CONFIGURATION ---
const API_BASE_URL = 'https://api.toosonj-guesthouse.com/v1'; // Mock API endpoint
const ROOM_CONFIG = {
    deluxe: { name: 'Deluxe Room', total: 4, price: 1499, advance: 699 },
    standard: { name: 'Standard Room', total: 3, price: 1099, advance: 499 }
};
const RAZORPAY_KEY = 'YOUR_RAZORPAY_KEY_ID'; // Replace with your actual key

// --- STATE MANAGEMENT ---
let bookingState = {
    checkin: null,
    checkout: null,
    duration: 0,
    rooms: {
        deluxe: { quantity: 0, available: 0 },
        standard: { quantity: 0, available: 0 }
    },
    guest: { name: '', email: '', phone: '' },
    payment: {
        method: null, // 'UPI' or 'CASH'
        totalAmount: 0,
        amountToPay: 0 // Can be total or advance
    },
    bookingId: null,
    checkinToken: null
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    document.getElementById('checkin').setAttribute('min', todayStr);

    document.getElementById('checkin').addEventListener('change', handleDateChange);
    document.getElementById('checkout').addEventListener('change', handleDateChange);
});

// --- CORE FUNCTIONS ---

/**
 * Handles changes in check-in or check-out dates to trigger availability check.
 */
async function handleDateChange() {
    const checkinDate = document.getElementById('checkin').value;
    const checkoutDate = document.getElementById('checkout').value;

    if (checkinDate) {
        const nextDay = new Date(checkinDate);
        nextDay.setDate(nextDay.getDate() + 1);
        document.getElementById('checkout').setAttribute('min', nextDay.toISOString().split('T')[0]);
    }

    if (checkinDate && checkoutDate && checkoutDate > checkinDate) {
        bookingState.checkin = checkinDate;
        bookingState.checkout = checkoutDate;
        await checkAllRoomsAvailability();
    }
}

/**
 * Simulates an API call to check availability for all room types.
 */
async function checkAllRoomsAvailability() {
    // Show a loading indicator if desired
    for (const type in ROOM_CONFIG) {
        const availabilityInfo = document.getElementById(`availability-${type}`);
        availabilityInfo.textContent = 'Checking...';
        availabilityInfo.classList.remove('hidden');
    }

    // Mock API call
    console.log(`Checking availability from ${bookingState.checkin} to ${bookingState.checkout}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    // Process results for each room type
    for (const type in ROOM_CONFIG) {
        // Mocked response from backend
        const availableCount = mockGetAvailableRooms(type, bookingState.checkin, bookingState.checkout);
        updateAvailabilityUI(type, availableCount);
    }
}

/**
 * Mocks backend logic to determine available rooms.
 * In a real app, this would query a database.
 * @param {string} roomType - 'deluxe' or 'standard'
 * @returns {number} - Number of available rooms.
 */
function mockGetAvailableRooms(roomType, checkin, checkout) {
    // This is a simple mock. A real backend would check bookings table.
    // For demonstration, let's make it seem like some rooms are booked.
    const dayOfMonth = new Date(checkin).getDate();
    const totalRooms = ROOM_CONFIG[roomType].total;
    if (dayOfMonth % 5 === 0) return Math.max(0, totalRooms - 2); // Heavy booking
    if (dayOfMonth % 3 === 0) return Math.max(0, totalRooms - 1); // Light booking
    return totalRooms; // All available
}

/**
 * Updates the UI to show room availability and quantity selector.
 * @param {string} type - 'deluxe' or 'standard'
 * @param {number} availableCount - Number of available rooms.
 */
function updateAvailabilityUI(type, availableCount) {
    const config = ROOM_CONFIG[type];
    const availabilityInfo = document.getElementById(`availability-${type}`);
    const quantityContainer = document.getElementById(`quantity-${type}`);
    const quantityInput = document.getElementById(`rooms-${type}`);

    bookingState.rooms[type].available = availableCount;

    if (availableCount > 0) {
        availabilityInfo.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ${availableCount} of ${config.total} rooms available`;
        availabilityInfo.className = 'availability-info';
        quantityInput.max = availableCount;
        quantityInput.value = 0;
        quantityContainer.classList.remove('hidden');
    } else {
        availabilityInfo.innerHTML = `<i class="fas fa-times-circle mr-2"></i> No rooms available for the selected dates.`;
        availabilityInfo.className = 'availability-info unavailable';
        quantityContainer.classList.add('hidden');
    }
    availabilityInfo.classList.remove('hidden');
}


// --- NAVIGATION & VALIDATION ---

function nextStep(currentStep) {
    if (!validateStep(currentStep)) return;

    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('completed');
    document.querySelector(`.step[data-step="${currentStep + 1}"]`).classList.add('active');

    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep + 1}`).classList.add('active');

    // Pre-computation for next steps
    if (currentStep === 2) updateBookingSummary();
    if (currentStep === 3) preparePaymentStep();
}

function prevStep(currentStep) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('completed');
    document.querySelector(`.step[data-step="${currentStep - 1}"]`).classList.add('active');

    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep - 1}`).classList.add('active');
}

function validateStep(step) {
    switch (step) {
        case 1:
            bookingState.rooms.deluxe.quantity = parseInt(document.getElementById('rooms-deluxe').value) || 0;
            bookingState.rooms.standard.quantity = parseInt(document.getElementById('rooms-standard').value) || 0;
            if (bookingState.rooms.deluxe.quantity === 0 && bookingState.rooms.standard.quantity === 0) {
                alert('Please select at least one room.');
                return false;
            }
            if (bookingState.rooms.deluxe.quantity > bookingState.rooms.deluxe.available || bookingState.rooms.standard.quantity > bookingState.rooms.standard.available) {
                alert('You have selected more rooms than are available.');
                return false;
            }
            return true;
        case 2:
            bookingState.guest.name = document.getElementById('guest_name').value.trim();
            bookingState.guest.email = document.getElementById('guest_email').value.trim();
            bookingState.guest.phone = document.getElementById('guest_phone').value.trim();
            if (!bookingState.guest.name || !bookingState.guest.email || !bookingState.guest.phone) {
                alert('Please fill in all guest information fields.');
                return false;
            }
            if (!/^\S+@\S+\.\S+$/.test(bookingState.guest.email)) {
                alert('Please enter a valid email address.');
                return false;
            }
            return true;
        case 3:
            return true; // No validation needed to proceed to payment choice
    }
}


// --- SUMMARY & PAYMENT ---

function updateBookingSummary() {
    const checkin = new Date(bookingState.checkin);
    const checkout = new Date(bookingState.checkout);
    bookingState.duration = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

    let total = 0;
    let summaryHTML = `
        <div class="summary-row"><span>Check-in:</span> <strong>${formatDate(checkin)}</strong></div>
        <div class="summary-row"><span>Check-out:</span> <strong>${formatDate(checkout)}</strong></div>
        <div class="summary-row"><span>Duration:</span> <strong>${bookingState.duration} nights</strong></div>
        <div class="summary-row"><span>Guest:</span> <strong>${bookingState.guest.name}</strong></div>
        <hr class="my-4">
    `;

    for (const type in bookingState.rooms) {
        const room = bookingState.rooms[type];
        if (room.quantity > 0) {
            const config = ROOM_CONFIG[type];
            const roomTotal = room.quantity * config.price * bookingState.duration;
            total += roomTotal;
            summaryHTML += `
                <div class="summary-row">
                    <span>${room.quantity} x ${config.name}</span>
                    <strong>₹${roomTotal.toLocaleString()}</strong>
                </div>
            `;
        }
    }
    
    bookingState.payment.totalAmount = total;
    summaryHTML += `
        <div class="summary-row summary-total">
            <span>Total Amount:</span>
            <span>₹${total.toLocaleString()}</span>
        </div>
    `;

    document.getElementById('booking-summary').innerHTML = summaryHTML;
}

function preparePaymentStep() {
    // Reset payment selection
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('payment-details').classList.add('hidden');
    document.getElementById('confirm-booking-btn').classList.add('hidden');
    bookingState.payment.method = null;
}

function selectPaymentMethod(method) {
    bookingState.payment.method = method;
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(`pay-${method.toLowerCase()}-option`).classList.add('selected');

    let amountToPay = 0;
    let detailsHTML = '';

    if (method === 'UPI') {
        amountToPay = bookingState.payment.totalAmount;
        detailsHTML = `<p class="text-center">You will be charged the full amount of <strong>₹${amountToPay.toLocaleString()}</strong>.</p>`;
    } else { // CASH
        let advanceTotal = 0;
        for (const type in bookingState.rooms) {
            if (bookingState.rooms[type].quantity > 0) {
                advanceTotal += bookingState.rooms[type].quantity * ROOM_CONFIG[type].advance;
            }
        }
        amountToPay = advanceTotal;
        detailsHTML = `
            <p class="text-center">To confirm your booking, please pay an advance of <strong>₹${amountToPay.toLocaleString()}</strong>.</p>
            <p class="text-center text-sm text-gray-500 mt-2">The remaining balance of ₹${(bookingState.payment.totalAmount - amountToPay).toLocaleString()} is due at check-in.</p>
        `;
    }
    
    bookingState.payment.amountToPay = amountToPay;
    const paymentDetails = document.getElementById('payment-details');
    paymentDetails.innerHTML = detailsHTML;
    paymentDetails.classList.remove('hidden');
    document.getElementById('confirm-booking-btn').classList.remove('hidden');
}

/**
 * Final step: "calls" the backend to confirm and sends all data.
 */
async function confirmBooking() {
    document.getElementById('payment-selection').classList.add('hidden');
    document.getElementById('loading-container').classList.remove('hidden');

    // MOCK API Call to create booking and get payment order
    console.log('Sending booking data to backend:', bookingState);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    const mockBackendResponse = {
        success: true,
        bookingId: `TGH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        checkinToken: `tok_${Math.random().toString(36).substr(2, 16)}`,
        razorpayOrderId: `order_${Math.random().toString(36).substr(2, 12)}`
    };
    
    bookingState.bookingId = mockBackendResponse.bookingId;
    bookingState.checkinToken = mockBackendResponse.checkinToken;

    // --- MOCK RAZORPAY INTEGRATION ---
    // In a real app, you would use the Razorpay Checkout script here.
    // We will simulate a successful payment.
    console.log(`Simulating Razorpay payment for order ${mockBackendResponse.razorpayOrderId} of amount ₹${bookingState.payment.amountToPay}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Payment successful!');
    
    // --- MOCK FINAL API CALL to confirm payment and send email ---
    console.log(`Confirming payment for booking ${bookingState.bookingId} with backend.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Backend confirmed. Mock email sent.');

    // --- SHOW SUCCESS UI ---
    document.getElementById('loading-container').classList.add('hidden');
    document.getElementById('booking-id').textContent = bookingState.bookingId;
    const checkinLink = document.getElementById('checkin-link-btn');
    checkinLink.href = `checkin.html?token=${bookingState.checkinToken}`;
    localStorage.setItem('lastBookingId', bookingState.bookingId);
    localStorage.setItem('lastCheckinToken', bookingState.checkinToken);
    document.getElementById('success-container').classList.remove('hidden');
}


// --- UTILITY FUNCTIONS ---
function formatDate(date) {
    return date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

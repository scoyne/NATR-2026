/**
 * NATR Purchase Form - JavaScript
 * Night at the Races 2025
 * 
 * This script runs AFTER the DOM is loaded (using defer attribute)
 * All elements are guaranteed to exist when this executes
 */

// ====================================
// CART DATA STRUCTURE
// ====================================
let cart = {
    eventTickets: null,
    horses: { quantity: 0, totalPrice: 0, entries: [] },
    programAds: [],
    raffleTickets: null,
    donation: null,
    cashDonation: null
};

// ====================================
// CONSTANTS
// ====================================
const PRICES = {
    TICKET: 25,
    HORSE: 25,
    RAFFLE_INDIVIDUAL: 5,
    RAFFLE_BOOK: 20,
    AD_BUSINESS_CARD: 25,
    AD_QUARTER: 25,
    AD_HALF: 50,
    AD_FULL: 100,
    AD_FULL_SPONSORED: 120,
    FEE_PERCENT: 0.029,
    FEE_FLAT: 0.30
};

// ====================================
// DOM ELEMENT REFERENCES
// ====================================
const DOM = {
    // Purchaser fields
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    dancerFamily: document.getElementById('dancerFamily'),
    
    // Event tickets
    eventTicketsCheck: document.getElementById('eventTicketsCheck'),
    eventTicketsFields: document.getElementById('eventTicketsFields'),
    ticketQuantity: document.getElementById('ticketQuantity'),
    tableReservationField: document.getElementById('tableReservationField'),
    tableName: document.getElementById('tableName'),
    
    // Horses
    horseSponsorshipCheck: document.getElementById('horseSponsorshipCheck'),
    horseSponsorshipFields: document.getElementById('horseSponsorshipFields'),
    horseQuantity: document.getElementById('horseQuantity'),
    horseEntriesContainer: document.getElementById('horseEntriesContainer'),
    
    // Program ads
    programAdCheck: document.getElementById('programAdCheck'),
    programAdFields: document.getElementById('programAdFields'),
    adsContainer: document.getElementById('adsContainer'),
    addAdBtn: document.getElementById('addAdBtn'),
    
    // Raffle tickets
    raffleTicketsCheck: document.getElementById('raffleTicketsCheck'),
    raffleTicketsFields: document.getElementById('raffleTicketsFields'),
    raffleType: document.getElementById('raffleType'),
    raffleQuantityIndividual: document.getElementById('raffleQuantityIndividual'),
    raffleQuantityBook: document.getElementById('raffleQuantityBook'),
    raffleIndividualOptions: document.getElementById('raffleIndividualOptions'),
    raffleBookOptions: document.getElementById('raffleBookOptions'),
    raffleEntriesContainer: document.getElementById('raffleEntriesContainer'),
    
    // Donations
    basketDonationCheck: document.getElementById('basketDonationCheck'),
    basketDonationFields: document.getElementById('basketDonationFields'),
    donationType: document.getElementById('donationType'),
    giftBasketFields: document.getElementById('giftBasketFields'),
    cashDonationFields: document.getElementById('cashDonationFields'),
    basketDescription: document.getElementById('basketDescription'),
    basketValue: document.getElementById('basketValue'),
    cashDonationAmount: document.getElementById('cashDonationAmount'),
    cashPurpose: document.getElementById('cashPurpose'),
    recognitionName: document.getElementById('recognitionName'),
    
    // Cart
    cartItems: document.getElementById('cartItems'),
    cartTotals: document.getElementById('cartTotals'),
    subtotalDisplay: document.getElementById('subtotal'),
    coverFeesCheckbox: document.getElementById('coverFeesCheckbox'),
    feeAmountDisplay: document.getElementById('feeAmount'),
    totalDisplay: document.getElementById('total'),
    checkoutBtn: document.getElementById('checkoutBtn')
};

// ====================================
// INITIALIZATION
// ====================================
function initializeDropdowns() {
    // Populate ticket quantity dropdown
    for (let i = 1; i <= 15; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} - $${i * 25}`;
        DOM.ticketQuantity.appendChild(option);
    }
    
    // Populate horse quantity dropdown
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} - $${i * 25}`;
        DOM.horseQuantity.appendChild(option);
    }
    
    // Populate raffle individual tickets dropdown
    for (let i = 1; i <= 25; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} Tickets - $${i * 5}`;
        DOM.raffleQuantityIndividual.appendChild(option);
    }
    
    // Populate raffle books dropdown
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} Book(s) (${i * 5} Tickets) - $${i * 20}`;
        DOM.raffleQuantityBook.appendChild(option);
    }
}

// ====================================
// CART FUNCTIONS
// ====================================
function updateCart() {
    let html = '';
    let subtotal = 0;
    const itemCounts = { paid: 0, donated: 0 };

    // Event Tickets
    if (cart.eventTickets && cart.eventTickets.quantity > 0) {
        subtotal += cart.eventTickets.total;
        itemCounts.paid++;
        html += `<div class="cart-item" role="listitem"><div><div class="cart-item-name">🎟️ Event Tickets</div><div class="cart-item-qty">${cart.eventTickets.quantity} × $${PRICES.TICKET}</div></div><div class="cart-item-price">$${cart.eventTickets.total.toFixed(2)}</div></div>`;
    }

    // Horse Sponsorships
    if (cart.horses.quantity > 0) {
        subtotal += cart.horses.totalPrice;
        itemCounts.paid++;
        html += `<div class="cart-item" role="listitem"><div><div class="cart-item-name">🏇 Horse Sponsorships</div><div class="cart-item-qty">${cart.horses.quantity} Horse(s)</div></div><div class="cart-item-price">$${cart.horses.totalPrice.toFixed(2)}</div></div>`;
    }
    
    // Program Ads
    cart.programAds.forEach((ad, index) => {
        if (ad.price > 0) {
            subtotal += ad.price;
            itemCounts.paid++;
            html += `<div class="cart-item" role="listitem"><div><div class="cart-item-name">📖 Program Ad #${index + 1}</div><div class="cart-item-qty">${ad.sizeLabel}</div></div><div class="cart-item-price">$${ad.price.toFixed(2)}</div></div>`;
        }
    });

    // Raffle Tickets
    if (cart.raffleTickets && cart.raffleTickets.totalPrice > 0) {
        subtotal += cart.raffleTickets.totalPrice;
        itemCounts.paid++;
        const qtyText = cart.raffleTickets.type === 'book' 
            ? `${cart.raffleTickets.books} Book(s) (${cart.raffleTickets.totalQuantity} Tix)` 
            : `${cart.raffleTickets.totalQuantity} Individual Tix`;
        html += `<div class="cart-item" role="listitem"><div><div class="cart-item-name">🎫 Raffle Tickets</div><div class="cart-item-qty">${qtyText}</div></div><div class="cart-item-price">$${cart.raffleTickets.totalPrice.toFixed(2)}</div></div>`;
    }

    // Cash Donation
    if (cart.cashDonation && cart.cashDonation.amount > 0) {
        subtotal += cart.cashDonation.amount;
        itemCounts.paid++;
        html += `<div class="cart-item" role="listitem"><div><div class="cart-item-name">💵 Cash Donation</div><div class="cart-item-qty">${cart.cashDonation.purpose || 'General Fund'}</div></div><div class="cart-item-price">$${cart.cashDonation.amount.toFixed(2)}</div></div>`;
    }

    // Gift Basket Donation (no charge)
    if (cart.donation && cart.donation.type === 'basket') {
        itemCounts.donated++;
        html += `<div class="cart-item" role="listitem"><div><div class="cart-item-name">🧺 Gift Basket Donation</div><div class="cart-item-qty">Value: ${cart.donation.valueLabel}</div></div><div class="cart-item-price">Thank you!</div></div>`;
    }

    // Update DOM
    DOM.cartItems.innerHTML = html || '<div class="cart-empty">Cart is empty</div>';
    DOM.cartTotals.style.display = (itemCounts.paid > 0 || itemCounts.donated > 0) ? 'block' : 'none';
    DOM.subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
    DOM.checkoutBtn.disabled = itemCounts.paid === 0;
    updateTotal(subtotal);

    // Hide fee option if no paid items
    const feeContainer = DOM.coverFeesCheckbox.closest('div');
    if (feeContainer) {
        feeContainer.style.display = subtotal > 0 ? 'block' : 'none';
    }
}

function updateTotal(subtotal) {
    const coverFees = DOM.coverFeesCheckbox.checked;
    let fee = 0;
    let total = subtotal;

    if (coverFees && subtotal > 0) {
        fee = (subtotal * PRICES.FEE_PERCENT) + PRICES.FEE_FLAT;
        total = subtotal + fee;
        DOM.feeAmountDisplay.textContent = `Fee: $${fee.toFixed(2)}`;
        DOM.feeAmountDisplay.style.display = 'block';
    } else {
        DOM.feeAmountDisplay.style.display = 'none';
    }

    DOM.totalDisplay.textContent = `$${total.toFixed(2)}`;
}

// ====================================
// VALIDATION FUNCTIONS
// ====================================
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateForm() {
    let isValid = true;
    let firstErrorElement = null;

    // Clear all error styling
    document.querySelectorAll('.form-input, .form-select').forEach(field => {
        field.style.borderColor = '';
    });

    // Required fields
    const requiredFields = [DOM.firstName, DOM.lastName, DOM.email, DOM.phone, DOM.dancerFamily];
    requiredFields.forEach(field => {
        if (!field.value || field.value.trim() === '' || (field.type === 'email' && !validateEmail(field.value))) {
            field.style.borderColor = '#ff5722';
            if (!firstErrorElement) firstErrorElement = field;
            isValid = false;
        }
    });

    // Table name for 8+ tickets
    if (cart.eventTickets && cart.eventTickets.quantity >= 8) {
        if (!DOM.tableName.value || DOM.tableName.value.trim() === '') {
            DOM.tableName.style.borderColor = '#ff5722';
            if (!firstErrorElement) firstErrorElement = DOM.tableName;
            isValid = false;
        }
    }

    // Horse names - only validate visible fields
    if (cart.horses && cart.horses.quantity > 0) {
        const horseNameInputs = document.querySelectorAll('.horse-name-input');
        const ownerNameInputs = document.querySelectorAll('.owner-name-input');
        
        horseNameInputs.forEach((horseField, index) => {
            const ownerField = ownerNameInputs[index];
            
            if (horseField && horseField.value.trim() === '') {
                horseField.style.borderColor = '#ff5722';
                if (!firstErrorElement) firstErrorElement = horseField;
                isValid = false;
            }
            
            if (ownerField && ownerField.value.trim() === '') {
                ownerField.style.borderColor = '#ff5722';
                if (!firstErrorElement) firstErrorElement = ownerField;
                isValid = false;
            }
        });
    }

    // Program ads
    if (cart.programAds && cart.programAds.length > 0) {
        cart.programAds.forEach((ad, index) => {
            const adContainer = document.getElementById(`ad-container-${index}`);
            if (!adContainer) return;
            
            const adSize = adContainer.querySelector('.ad-size-select');
            const adBusiness = adContainer.querySelector('.ad-business-name');
            const adDesign = adContainer.querySelector('.ad-design-option');
            
            if (adSize && adSize.value === '') {
                adSize.style.borderColor = '#ff5722';
                if (!firstErrorElement) firstErrorElement = adSize;
                isValid = false;
            }
            if (adBusiness && adBusiness.value.trim() === '') {
                adBusiness.style.borderColor = '#ff5722';
                if (!firstErrorElement) firstErrorElement = adBusiness;
                isValid = false;
            }
            if (adDesign && adDesign.value === '') {
                adDesign.style.borderColor = '#ff5722';
                if (!firstErrorElement) firstErrorElement = adDesign;
                isValid = false;
            }
        });
    }

    // Cash donation
    if (DOM.donationType.value === 'cash' && (parseFloat(DOM.cashDonationAmount.value) || 0) <= 0) {
        DOM.cashDonationAmount.style.borderColor = '#ff5722';
        if (!firstErrorElement) firstErrorElement = DOM.cashDonationAmount;
        isValid = false;
    }
    
    // Raffle tickets
    if (cart.raffleTickets && cart.raffleTickets.entries && cart.raffleTickets.entries.length > 0) {
        const raffleNames = document.querySelectorAll('.raffle-name-input');
        const raffleContacts = document.querySelectorAll('.raffle-contact-input');
        
        raffleNames.forEach((nameField, index) => {
            const contactField = raffleContacts[index];
            
            if (nameField && nameField.value.trim() === '') {
                nameField.style.borderColor = '#ff5722';
                if (!firstErrorElement) firstErrorElement = nameField;
                isValid = false;
            }
            if (contactField && contactField.value.trim() === '') {
                contactField.style.borderColor = '#ff5722';
                if (!firstErrorElement) firstErrorElement = contactField;
                isValid = false;
            }
        });
    }

    // Scroll to first error
    if (!isValid && firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
}

// ====================================
// HORSE FIELDS - FIXED VERSION
// ====================================
function updateHorseFields() {
    const qty = cart.horses.quantity;
    
    // Don't regenerate if quantity hasn't changed
    const existingFields = document.querySelectorAll('.horse-name-input');
    if (existingFields.length === qty) {
        return;
    }
    
    // Save existing values
    const existingValues = {};
    for (let i = 0; i < existingFields.length; i++) {
        const horseName = document.getElementById(`horse-name-${i}`)?.value || '';
        const ownerName = document.getElementById(`owner-name-${i}`)?.value || '';
        existingValues[i] = { horseName, ownerName };
    }
    
    cart.horses.entries = [];
    let html = '';

    for (let i = 0; i < qty; i++) {
        const savedHorseName = existingValues[i]?.horseName || '';
        const savedOwnerName = existingValues[i]?.ownerName || '';
        
        html += `
            <div class="horse-entry">
                <div class="info-box"><p>🏇 Horse #${i + 1}</p></div>
                <div class="form-group">
                    <label class="form-label">Horse Name<span class="required">*</span></label>
                    <input 
                        type="text" 
                        class="form-input horse-name-input" 
                        id="horse-name-${i}" 
                        placeholder="e.g., Irish Charger"
                        value="${savedHorseName}"
                        aria-label="Horse ${i + 1} Name"
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Owner Name (for Announcement)<span class="required">*</span></label>
                    <input 
                        type="text" 
                        class="form-input owner-name-input" 
                        id="owner-name-${i}" 
                        placeholder="e.g., The Murphy Family"
                        value="${savedOwnerName}"
                        aria-label="Horse ${i + 1} Owner"
                    >
                </div>
            </div>
        `;
        
        cart.horses.entries.push({ 
            number: i + 1, 
            name: savedHorseName, 
            owner: savedOwnerName 
        });
    }
    
    DOM.horseEntriesContainer.innerHTML = html;
    
    // Attach event listeners AFTER HTML is set
    setTimeout(() => {
        document.querySelectorAll('.horse-name-input, .owner-name-input').forEach(input => {
            input.addEventListener('input', function() {
                const index = parseInt(this.id.split('-').pop());
                const isHorseName = this.classList.contains('horse-name-input');
                
                if (cart.horses.entries[index]) {
                    if (isHorseName) {
                        cart.horses.entries[index].name = this.value.trim();
                    } else {
                        cart.horses.entries[index].owner = this.value.trim();
                    }
                }
                
                this.style.borderColor = '';
            });
        });
    }, 0);
}

// ====================================
// RAFFLE FIELDS - FIXED VERSION
// ====================================
function updateRaffleFields() {
    const type = DOM.raffleType.value;
    const isIndividual = type === 'individual';
    const isBook = type === 'book';
    
    DOM.raffleIndividualOptions.style.display = isIndividual ? 'block' : 'none';
    DOM.raffleBookOptions.style.display = isBook ? 'block' : 'none';

    if (!cart.raffleTickets) {
        cart.raffleTickets = { 
            type: '', 
            individualTickets: 0, 
            books: 0, 
            totalQuantity: 0, 
            totalPrice: 0, 
            entries: [] 
        };
    }

    const qty = isIndividual 
        ? (parseInt(DOM.raffleQuantityIndividual.value) || 0) 
        : isBook 
        ? (parseInt(DOM.raffleQuantityBook.value) || 0) 
        : 0;

    const existingFields = document.querySelectorAll('.raffle-name-input');
    const expectedEntries = qty;
    
    if (existingFields.length === expectedEntries && cart.raffleTickets.type === type) {
        cart.raffleTickets.type = type;
        cart.raffleTickets.individualTickets = isIndividual ? qty : 0;
        cart.raffleTickets.books = isBook ? qty : 0;
        cart.raffleTickets.totalQuantity = isIndividual ? qty : (isBook ? qty * 5 : 0);
        cart.raffleTickets.totalPrice = isIndividual ? qty * PRICES.RAFFLE_INDIVIDUAL : (isBook ? qty * PRICES.RAFFLE_BOOK : 0);
        return;
    }

    const existingValues = {};
    for (let i = 0; i < existingFields.length; i++) {
        const name = document.getElementById(`raffle-name-${i}`)?.value || '';
        const contact = document.getElementById(`raffle-contact-${i}`)?.value || '';
        existingValues[i] = { name, contact };
    }

    let totalEntries = 0;
    let totalTickets = 0;
    let html = '';
    
    cart.raffleTickets.entries = [];
    
    if (isIndividual) {
        totalEntries = qty;
        totalTickets = qty;
    } else if (isBook) {
        totalEntries = qty;
        totalTickets = qty * 5;
    }

    for (let i = 0; i < totalEntries; i++) {
        const ticketsPerEntry = isBook ? 5 : 1;
        const entryLabel = isBook ? `Book #${i + 1} (${ticketsPerEntry} Tickets)` : `Ticket #${i + 1}`;
        
        const savedName = existingValues[i]?.name || '';
        const savedContact = existingValues[i]?.contact || '';
        
        html += `
            <div class="horse-entry">
                <div class="info-box"><p>🎫 ${entryLabel}</p></div>
                <div class="form-group">
                    <label class="form-label">Owner's Full Name<span class="required">*</span></label>
                    <input 
                        type="text" 
                        class="form-input raffle-name-input" 
                        id="raffle-name-${i}" 
                        placeholder="Name for Ticket(s)"
                        value="${savedName}"
                        aria-label="Raffle ${entryLabel} Owner Name"
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Owner's Contact (Email/Phone)<span class="required">*</span></label>
                    <input 
                        type="text" 
                        class="form-input raffle-contact-input" 
                        id="raffle-contact-${i}" 
                        placeholder="Email or Phone"
                        value="${savedContact}"
                        aria-label="Raffle ${entryLabel} Contact"
                    >
                </div>
            </div>
        `;
        
        cart.raffleTickets.entries.push({ 
            number: i + 1, 
            name: savedName, 
            contact: savedContact, 
            tickets: ticketsPerEntry
        });
    }

    DOM.raffleEntriesContainer.innerHTML = html;

    cart.raffleTickets.type = type;
    cart.raffleTickets.individualTickets = isIndividual ? qty : 0;
    cart.raffleTickets.books = isBook ? qty : 0;
    cart.raffleTickets.totalQuantity = totalTickets;
    cart.raffleTickets.totalPrice = isIndividual ? qty * PRICES.RAFFLE_INDIVIDUAL : (isBook ? qty * PRICES.RAFFLE_BOOK : 0);
    
    setTimeout(() => {
        document.querySelectorAll('.raffle-name-input, .raffle-contact-input').forEach(input => {
            input.addEventListener('input', function() {
                const index = parseInt(this.id.split('-').pop());
                const isName = this.classList.contains('raffle-name-input');
                
                if (cart.raffleTickets.entries[index]) {
                    if (isName) {
                        cart.raffleTickets.entries[index].name = this.value.trim();
                    } else {
                        cart.raffleTickets.entries[index].contact = this.value.trim();
                    }
                }
                
                this.style.borderColor = '';
            });
        });
    }, 0);
}

// ====================================
// PROGRAM ADS
// ====================================
function getAdPriceAndLabel(value) {
    switch (value) {
        case 'business-card-25': return { price: PRICES.AD_BUSINESS_CARD, sizeLabel: 'Business Card (¼ page)' };
        case 'quarter-25': return { price: PRICES.AD_QUARTER, sizeLabel: '¼ Page' };
        case 'half-50': return { price: PRICES.AD_HALF, sizeLabel: '½ Page' };
        case 'full-100': return { price: PRICES.AD_FULL, sizeLabel: 'Full Page' };
        case 'full-sponsored-120': return { price: PRICES.AD_FULL_SPONSORED, sizeLabel: 'Full Page + Sponsored Race' };
        default: return { price: 0, sizeLabel: '' };
    }
}

function generateAdHTML(index) {
    return `
        <div class="ad-container" id="ad-container-${index}" data-ad-index="${index}">
            ${index > 0 ? `<button type="button" class="btn btn-secondary" onclick="removeAd(${index})">Remove Ad #${index + 1}</button>` : ''}
            <div class="info-box"><p>📖 Ad #${index + 1}</p></div>
            
            <div class="form-group">
                <label class="form-label">Ad Size & Price<span class="required">*</span></label>
                <select class="form-select ad-size-select" data-index="${index}" aria-label="Ad ${index + 1} Size">
                    <option value="">Select Size</option>
                    <option value="business-card-25">$25 - Business Card (¼ page)</option>
                    <option value="quarter-25">$25 - ¼ Page</option>
                    <option value="half-50">$50 - ½ Page</option>
                    <option value="full-100">$100 - Full Page</option>
                    <option value="full-sponsored-120">$120 - Full Page + Sponsored Race</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Business / Purchaser Name<span class="required">*</span></label>
                <input type="text" class="form-input ad-business-name" data-index="${index}" placeholder="Name for Program Book" aria-label="Ad ${index + 1} Business Name">
            </div>

            <div class="form-group">
                <label class="form-label">Ad Design Option<span class="required">*</span></label>
                <select class="form-select ad-design-option" data-index="${index}" aria-label="Ad ${index + 1} Design Option">
                    <option value="">Select Option</option>
                    <option value="upload">I'll Design & Upload My Own Ad</option>
                    <option value="create">Please Create an Ad for Me</option>
                </select>
            </div>
            
            <div class="ad-upload-field" data-index="${index}" style="display:none;">
                <div class="info-box"><p>Upload your PDF, JPG, or PNG file here.</p></div>
                <div class="form-group">
                    <label class="form-label">Upload Graphic</label>
                    <input type="file" class="form-input ad-file-upload" data-index="${index}" accept=".pdf,.jpg,.jpeg,.png" aria-label="Ad ${index + 1} File Upload">
                </div>
            </div>

            <div class="ad-create-field" data-index="${index}" style="display:none;">
                <div class="form-group">
                    <label class="form-label">Ad Content / Instructions</label>
                    <textarea class="form-input ad-content-instructions" data-index="${index}" placeholder="e.g., Use logo attached and text: 'Proud Sponsor of the BC Dancers!'" aria-label="Ad ${index + 1} Instructions"></textarea>
                </div>
            </div>
        </div>
    `;
}

function addAd() {
    if (cart.programAds.length >= 5) return;

    const index = cart.programAds.length;
    cart.programAds.push({ 
        adNumber: index + 1, price: 0, sizeLabel: '', businessName: '', designOption: '', 
        file: null, instructions: ''
    });

    DOM.adsContainer.insertAdjacentHTML('beforeend', generateAdHTML(index));
    DOM.addAdBtn.style.display = cart.programAds.length < 5 ? 'block' : 'none';
}

function removeAd(index) {
    cart.programAds.splice(index, 1);
    const adElement = document.getElementById(`ad-container-${index}`);
    if (adElement) adElement.remove();

    cart.programAds.forEach((ad, i) => {
        ad.adNumber = i + 1;
    });

    DOM.addAdBtn.style.display = cart.programAds.length < 5 ? 'block' : 'none';
    updateCart();
}

// ====================================
// DONATIONS
// ====================================
function updateDonationFields() {
    const type = DOM.donationType.value;
    DOM.giftBasketFields.style.display = (type === 'basket') ? 'block' : 'none';
    DOM.cashDonationFields.style.display = (type === 'cash') ? 'block' : 'none';

    if (type === 'basket') {
        cart.donation = {
            type: 'basket',
            description: DOM.basketDescription.value.trim(),
            value: DOM.basketValue.value,
            valueLabel: DOM.basketValue.options[DOM.basketValue.selectedIndex]?.text || '',
            recognition: DOM.recognitionName.value.trim()
        };
        cart.cashDonation = null;
        DOM.cashDonationAmount.value = '';
    } else if (type === 'cash') {
        const amount = parseFloat(DOM.cashDonationAmount.value) || 0;
        cart.cashDonation = {
            amount: amount,
            purpose: DOM.cashPurpose.value,
            recognition: DOM.recognitionName.value.trim()
        };
        cart.donation = null;
        DOM.basketDescription.value = '';
        DOM.basketValue.value = '';
    } else {
        cart.donation = null;
        cart.cashDonation = null;
    }
    updateCart();
}

// ====================================
// EVENT LISTENERS
// ====================================

// Event Tickets
DOM.eventTicketsCheck.addEventListener('change', function() {
    DOM.eventTicketsFields.classList.toggle('visible', this.checked);
    if (!this.checked) { 
        DOM.ticketQuantity.value = '';
        DOM.tableName.value = '';
        DOM.tableReservationField.style.display = 'none';
        cart.eventTickets = null; 
    }
    updateCart();
});

DOM.ticketQuantity.addEventListener('change', function() {
    const qty = parseInt(this.value) || 0;
    cart.eventTickets = qty > 0 ? { 
        quantity: qty, 
        price: PRICES.TICKET, 
        total: qty * PRICES.TICKET, 
        tableName: DOM.tableName.value.trim() 
    } : null;
    
    DOM.tableReservationField.style.display = (qty >= 8) ? 'block' : 'none';
    if (qty < 8) DOM.tableName.value = '';

    updateCart();
});

DOM.tableName.addEventListener('input', function() {
    if (cart.eventTickets) {
        cart.eventTickets.tableName = this.value.trim();
    }
});

// Horse Sponsorship
DOM.horseSponsorshipCheck.addEventListener('change', function() {
    DOM.horseSponsorshipFields.classList.toggle('visible', this.checked);
    if (!this.checked) { 
        DOM.horseQuantity.value = '';
        cart.horses = { quantity: 0, totalPrice: 0, entries: [] }; 
    }
    updateCart();
});

DOM.horseQuantity.addEventListener('change', function() {
    const qty = parseInt(this.value) || 0;
    cart.horses.quantity = qty;
    cart.horses.totalPrice = qty * PRICES.HORSE;
    updateHorseFields();
    updateCart();
});

// Program Ads
DOM.programAdCheck.addEventListener('change', function() {
    DOM.programAdFields.classList.toggle('visible', this.checked);
    if (this.checked && cart.programAds.length === 0) {
        addAd();
    } else if (!this.checked) {
        DOM.adsContainer.innerHTML = '';
        cart.programAds = [];
        DOM.addAdBtn.style.display = 'none';
    }
    updateCart();
});

DOM.addAdBtn.addEventListener('click', addAd);

DOM.programAdFields.addEventListener('change', function(e) {
    const target = e.target;
    const index = parseInt(target.getAttribute('data-index'));
    const ad = cart.programAds[index];
    if (!ad) return;

    if (target.classList.contains('ad-size-select')) {
        const { price, sizeLabel } = getAdPriceAndLabel(target.value);
        ad.price = price;
        ad.sizeLabel = sizeLabel;
        updateCart();
    } else if (target.classList.contains('ad-design-option')) {
        ad.designOption = target.value;
        const adContainer = document.getElementById(`ad-container-${index}`);
        if (adContainer) {
            adContainer.querySelector('.ad-upload-field').style.display = (target.value === 'upload') ? 'block' : 'none';
            adContainer.querySelector('.ad-create-field').style.display = (target.value === 'create') ? 'block' : 'none';
        }
    } else if (target.classList.contains('ad-file-upload')) {
        ad.file = target.files[0] || null;
    }
});

DOM.programAdFields.addEventListener('input', function(e) {
    const target = e.target;
    const index = parseInt(target.getAttribute('data-index'));
    const ad = cart.programAds[index];
    if (!ad) return;

    if (target.classList.contains('ad-business-name')) {
        ad.businessName = target.value.trim();
    } else if (target.classList.contains('ad-content-instructions')) {
        ad.instructions = target.value.trim();
    }
});

// Raffle Tickets
DOM.raffleTicketsCheck.addEventListener('change', function() {
    DOM.raffleTicketsFields.classList.toggle('visible', this.checked);
    if (!this.checked) { 
        DOM.raffleType.value = '';
        DOM.raffleQuantityIndividual.value = '';
        DOM.raffleQuantityBook.value = '';
        cart.raffleTickets = null; 
    } else {
        cart.raffleTickets = { 
            type: '', individualTickets: 0, books: 0, 
            totalQuantity: 0, totalPrice: 0, entries: [] 
        };
    }
    updateRaffleFields();
    updateCart(); 
});

DOM.raffleType.addEventListener('change', function() {
    DOM.raffleQuantityIndividual.value = '';
    DOM.raffleQuantityBook.value = '';
    updateRaffleFields();
    updateCart();
});

DOM.raffleQuantityIndividual.addEventListener('change', function() {
    updateRaffleFields();
    updateCart();
});

DOM.raffleQuantityBook.addEventListener('change', function() {
    updateRaffleFields();
    updateCart();
});

// Donations
DOM.basketDonationCheck.addEventListener('change', function() {
    DOM.basketDonationFields.classList.toggle('visible', this.checked);
    if (!this.checked) { 
        DOM.donationType.value = '';
        DOM.giftBasketFields.style.display = 'none';
        DOM.cashDonationFields.style.display = 'none';
        cart.donation = null;
        cart.cashDonation = null;
    }
    updateDonationFields();
});

DOM.donationType.addEventListener('change', updateDonationFields);
DOM.cashDonationAmount.addEventListener('input', updateDonationFields);
DOM.basketDescription.addEventListener('input', updateDonationFields);
DOM.basketValue.addEventListener('change', updateDonationFields);
DOM.cashPurpose.addEventListener('change', updateDonationFields);
DOM.recognitionName.addEventListener('input', updateDonationFields);

// Clear error styling on input
[DOM.firstName, DOM.lastName, DOM.email, DOM.phone, DOM.dancerFamily].forEach(field => {
    field.addEventListener('input', () => {
        field.style.borderColor = '';
    });
});

// Fee coverage checkbox
DOM.coverFeesCheckbox.addEventListener('change', function() {
    const subtotal = parseFloat(DOM.subtotalDisplay.textContent.replace('$', '')) || 0;
    updateTotal(subtotal);
});

// ====================================
// CHECKOUT
// ====================================
DOM.checkoutBtn.addEventListener('click', async function() {
    if (!validateForm()) {
        alert('❌ Please fill in all required fields before proceeding.');
        return;
    }

    const purchaserInfo = {
        firstName: DOM.firstName.value.trim(),
        lastName: DOM.lastName.value.trim(),
        email: DOM.email.value.trim(),
        phone: DOM.phone.value.trim(),
        dancerFamily: DOM.dancerFamily.value,
        subtotal: parseFloat(DOM.subtotalDisplay.textContent.replace(/[$,]/g, '')),
        total: parseFloat(DOM.totalDisplay.textContent.replace(/[$,]/g, '')),
        coverFees: DOM.coverFeesCheckbox.checked,
    };
    
    const purchaseData = {
        purchaser: purchaserInfo,
        cart: cart,
        totals: {
            subtotal: purchaserInfo.subtotal,
            coveringFees: purchaserInfo.coverFees,
            processingFee: purchaserInfo.coverFees ? ((purchaserInfo.subtotal * PRICES.FEE_PERCENT) + PRICES.FEE_FLAT) : 0,
            finalTotal: purchaserInfo.total
        }
    };

    console.log('✅ Validation passed - Creating Stripe checkout');

    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Processing...';
    btn.classList.add('loading');

    try {
        const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(purchaseData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.url) {
            console.log('🚀 Redirecting to Stripe...');
            window.location.href = result.url;
        } else {
            throw new Error(result.error || 'No checkout URL returned');
        }

    } catch (error) {
        console.error('❌ Checkout error:', error);
        
        let errorMessage = '❌ Checkout Error\n\n';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Cannot connect to server.\n\nCheck your internet connection.';
        } else if (error.message.includes('404')) {
            errorMessage += 'Payment function not found.\n\nThe API may not be deployed yet.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        btn.disabled = false;
        btn.textContent = 'Proceed to Checkout';
        btn.classList.remove('loading');
    }
});

// ====================================
// INITIALIZE ON PAGE LOAD
// ====================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 NATR Purchase Form Loaded');
    initializeDropdowns();
    updateCart();
});

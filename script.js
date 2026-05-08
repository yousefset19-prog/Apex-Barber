// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.classList.remove('open');
  }
});

// Navbar shrink on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.style.borderBottomColor = window.scrollY > 50
    ? 'rgba(234,171,0,0.25)'
    : '#e2e2e2';
});

// ── Booking Modal ──
const overlay    = document.getElementById('bookingOverlay');
const closeBtn   = document.getElementById('bookingClose');
const confirmBtn = document.getElementById('bookingConfirm');

flatpickr('#bookingDateInput', {
  minDate: 'today',
  disableMobile: true,
  dateFormat: 'D, d M Y',
});

document.querySelectorAll('.btn-book, .fixed-book-tab').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    overlay.classList.add('open');
  });
});

closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', e => {
  if (e.target === overlay) overlay.classList.remove('open');
});

document.querySelectorAll('.time-slot').forEach(slot => {
  slot.addEventListener('click', () => {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
  });
});

// ── Call Now popup ──
const callBar   = document.getElementById('callBar');
const callPopup = document.getElementById('callPopup');

callBar.addEventListener('click', e => {
  e.stopPropagation();
  callPopup.classList.toggle('open');
});

document.addEventListener('click', () => callPopup.classList.remove('open'));

const serviceOverlay = document.getElementById('serviceOverlay');
const serviceClose   = document.getElementById('serviceClose');
let bookingDate = '', bookingTime = '';

confirmBtn.addEventListener('click', () => {
  const date = document.getElementById('bookingDateInput').value;
  const time = document.querySelector('.time-slot.selected')?.dataset.time;
  if (!date || !time) {
    alert('Please select a date and time.');
    return;
  }
  bookingDate = date;
  bookingTime = time;
  overlay.classList.remove('open');
  serviceOverlay.classList.add('open');
});

serviceClose.addEventListener('click', () => serviceOverlay.classList.remove('open'));
serviceOverlay.addEventListener('click', e => {
  if (e.target === serviceOverlay) serviceOverlay.classList.remove('open');
});

// Tabs
document.querySelectorAll('.svc-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.svc-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.svc-list').forEach(l => l.style.display = 'none');
    document.getElementById('tab-' + tab.dataset.tab).style.display = 'flex';
  });
});

// Quantity buttons + total
function updateTotal() {
  let total = 0;
  document.querySelectorAll('.svc-item').forEach(item => {
    const qty = parseInt(item.querySelector('.qty-val').textContent);
    const price = parseInt(item.dataset.price);
    total += qty * price;
  });
  document.getElementById('svcTotal').textContent = 'AED ' + total;
}

document.querySelectorAll('.qty-plus').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.closest('.svc-qty').querySelector('.qty-val');
    val.textContent = parseInt(val.textContent) + 1;
    updateTotal();
  });
});

document.querySelectorAll('.qty-minus').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.closest('.svc-qty').querySelector('.qty-val');
    const current = parseInt(val.textContent);
    if (current > 0) { val.textContent = current - 1; updateTotal(); }
  });
});

const stripe = Stripe('pk_test_51TPX3IBXmSv3whAsqRXvrami7NT5TRgSMnjek6rFYhvWfKEvmeEkLrW1BknC0fWAiqqRtVTsK1hsCJKl2HaTATzR00AzDeWzdF');
let stripeElements = null;
let stripeLoaded = false;
let pendingItems = [];
let pendingTotal = 0;

function resetPaymentView() {
  document.getElementById('payment-element').innerHTML = '';
  document.getElementById('payment-error').style.display = 'none';
  document.getElementById('placeOrder').style.display = '';
  document.querySelector('input[value="arrival"]').checked = true;
  document.getElementById('choiceArrival').classList.add('active');
  document.getElementById('choiceOnline').classList.remove('active');
  document.getElementById('onlinePaySection').style.display = 'none';
  document.getElementById('arrivalPaySection').style.display = 'block';
  stripeElements = null;
  stripeLoaded = false;
}

document.getElementById('proceedPayment').addEventListener('click', () => {
  const items = [];
  document.querySelectorAll('.svc-item').forEach(item => {
    const qty = parseInt(item.querySelector('.qty-val').textContent);
    if (qty > 0) {
      items.push({
        name: item.querySelector('.svc-name').textContent,
        price: parseInt(item.dataset.price),
        quantity: qty,
      });
    }
  });

  if (items.length === 0) {
    alert('Please select at least one service.');
    return;
  }

  pendingItems = items;
  pendingTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  document.getElementById('svcView').style.display = 'none';
  document.getElementById('paymentView').style.display = 'block';

  document.getElementById('payOrderItems').innerHTML = items.map(i =>
    `<div class="pay-order-item"><span>${i.name} \xd7 ${i.quantity}</span><span>AED ${i.price * i.quantity}</span></div>`
  ).join('');
  document.getElementById('paySubtotal').textContent = `AED ${pendingTotal}`;
  document.getElementById('payTotalDisplay').textContent = `AED ${pendingTotal}`;
  document.getElementById('payBtnTotal').textContent = `AED ${pendingTotal}`;

  resetPaymentView();
});

// Payment method toggle
document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
  radio.addEventListener('change', async () => {
    document.querySelectorAll('.pay-choice-card').forEach(c => c.classList.remove('active'));
    radio.closest('.pay-choice-card').classList.add('active');

    if (radio.value === 'arrival') {
      document.getElementById('onlinePaySection').style.display = 'none';
      document.getElementById('arrivalPaySection').style.display = 'block';
    } else {
      document.getElementById('arrivalPaySection').style.display = 'none';
      document.getElementById('onlinePaySection').style.display = 'block';

      if (!stripeLoaded) {
        const placeBtn = document.getElementById('placeOrder');
        placeBtn.disabled = true;
        placeBtn.textContent = 'Loading payment…';

        try {
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: pendingItems }),
          });
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { throw new Error('Raw response: ' + text.substring(0, 120)); }
          if (!res.ok || !data.clientSecret) throw new Error(data.error || 'Unknown error');

          stripeElements = stripe.elements({ clientSecret: data.clientSecret, appearance: { theme: 'stripe' } });
          stripeElements.create('payment').mount('#payment-element');
          stripeLoaded = true;

          placeBtn.disabled = false;
          placeBtn.innerHTML = `PLACE ORDER — AED ${pendingTotal} &#8250;`;
        } catch (err) {
          const errEl = document.getElementById('payment-error');
          errEl.textContent = err.message;
          errEl.style.display = 'block';
          placeBtn.textContent = 'Error — try again';
          placeBtn.disabled = false;
        }
      }
    }
  });
});

document.getElementById('payBack').addEventListener('click', () => {
  document.getElementById('paymentView').style.display = 'none';
  document.getElementById('svcView').style.display = 'block';
  resetPaymentView();
});

document.getElementById('placeOrder').addEventListener('click', async () => {
  if (!stripeElements) return;
  const placeBtn = document.getElementById('placeOrder');
  placeBtn.disabled = true;
  placeBtn.textContent = 'Processing…';

  const { error } = await stripe.confirmPayment({
    elements: stripeElements,
    confirmParams: { return_url: `${window.location.origin}/success.html` },
  });

  if (error) {
    const errEl = document.getElementById('payment-error');
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    placeBtn.disabled = false;
    placeBtn.innerHTML = `PLACE ORDER &#8250;`;
  }
});

document.getElementById('confirmArrival').addEventListener('click', () => {
  serviceOverlay.classList.remove('open');
  resetPaymentView();
  document.getElementById('paymentView').style.display = 'none';
  document.getElementById('svcView').style.display = 'block';
  document.querySelectorAll('.qty-val').forEach(v => v.textContent = '0');
  updateTotal();

  document.getElementById('toastDetails').textContent = `${bookingDate} at ${bookingTime}`;
  const toast = document.getElementById('bookingToast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4500);
});

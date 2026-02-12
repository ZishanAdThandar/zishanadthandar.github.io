const API_BASE = window.location.hostname.includes('localhost') 
  ? 'http://localhost:8787' 
  : 'https://api.zishanhack.com';

let authToken = null;
let userEmail = null;
let userPurchases = {};

const PRODUCTS = [
  {
    id: 'oscp_bundle',
    name: 'OSCP+ Obsidian Notes Bundle',
    description: 'Complete preparation package for OSCP certification.',
    price: 97,
    originalPrice: 997,
    discount: '90% OFF',
    badges: ['🏅 Premium', '⚡ Career-Boosting', '📚 Properly Arranged'],
    icon: 'fas fa-certificate',
    iconColor: '#f59e0b',
    salesCount: '1,500+',
    features: ['Obsidian Notes', 'Copy Paste Commands', 'Active Directory Commands', 'Professional Report Writing']
  },
  {
    id: 'ultimate_checklist',
    name: 'Ultimate Web Security Checklist for Bug Hunters',
    description: 'Comprehensive checklist for bug bounty hunters and pentesters.',
    price: 25,
    originalPrice: 250,
    discount: '90% OFF',
    badges: ['🏆 Top Rated', '📈 Trending', '🔒 Trusted'],
    icon: 'fas fa-clipboard-check',
    iconColor: '#10b981',
    salesCount: '2,000+',
    features: ['OWASP Top 10', 'API security', 'Crafted for Hunters', 'Tested Checklist']
  },
  {
    id: 'crta_notes',
    name: 'CRTA Copy Paste Commands eBook',
    description: 'Battle-tested notes with copy-paste commands for CyberWarFare Labs CRTA Assessment success.',
    price: 5, 
    originalPrice: 50,
    discount: '90% OFF',
    badges: ['✨ Top rated', '🎯 500+ Sold', '⭐ 5/5'],
    icon: 'fas fa-user-secret',
    iconColor: '#ef4444',
    salesCount: '500+',
    features: ['Tested Commands List', 'Copy-paste commands', 'AD attack guides', 'Privilege escalation']
  },
  {
    id: 'oswp_notes',
    name: 'OSWP Copy Paste Commands eBook',
    description: 'Wireless pentesting notes and cheatsheet for Offsec OSWP Certification Test.',
    price: 27,
    originalPrice: 270,
    discount: '90% OFF',
    badges: ['🆕 New', '📖 eBook', '🎯 Focused'],
    icon: 'fas fa-wifi',
    iconColor: '#6366f1',
    salesCount: '300+',
    features: ['Wireless commands', 'Proper cheatsheet', 'Rogue AP setup', 'Full Assessment guide']
  }
];

// ===== TOKEN MANAGEMENT =====
function getTokenFromStorage() {
  try {
    return localStorage.getItem('zishanhack_token');
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return null;
  }
}

function setTokenToStorage(token) {
  if (!token) return;
  try {
    localStorage.setItem('zishanhack_token', token);
    authToken = token;
  } catch (e) {
    console.error('Error writing to localStorage:', e);
  }
}

function removeTokenFromStorage() {
  try {
    localStorage.removeItem('zishanhack_token');
    authToken = null;
  } catch (e) {
    console.error('Error removing from localStorage:', e);
  }
}

function getTokenFromCookie() {
  try {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token') {
        try {
          return decodeURIComponent(value);
        } catch (e) {
          return value;
        }
      }
    }
  } catch (e) {
    console.error('Error reading cookies:', e);
  }
  return null;
}

function clearAuthCookie() {
  const domains = ['', '; domain=.zishanhack.com'];
  const paths = ['/', '; path=/'];
  
  domains.forEach(domain => {
    paths.forEach(path => {
      document.cookie = `auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC${path}${domain}; Secure; SameSite=Strict`;
    });
  });
}

function getToken() {
  if (authToken) return authToken;
  
  const storedToken = getTokenFromStorage();
  if (storedToken) {
    authToken = storedToken;
    return storedToken;
  }
  
  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    authToken = cookieToken;
    setTokenToStorage(cookieToken);
    return cookieToken;
  }
  
  return null;
}

function decodeTokenPayload(token) {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    
    if (parts.length === 3) {
      try {
        return JSON.parse(atob(parts[1]));
      } catch (e) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        return JSON.parse(atob(padded));
      }
    }
    
    if (parts.length === 2) {
      try {
        return JSON.parse(atob(parts[0]));
      } catch (e) {}
    }
  } catch (e) {}
  
  return null;
}

function isTokenExpired(payload) {
  if (!payload || !payload.exp) return true;
  return payload.exp < Math.floor(Date.now() / 1000);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initializeAuth();
  loadProducts();
  checkPaymentCallback();
  setupOTPInputs();
  loadRazorpaySDK();
});

// ===== AUTH FUNCTIONS =====
function initializeAuth() {
  const token = getToken();
  
  if (token) {
    try {
      const payload = decodeTokenPayload(token);
      
      if (!payload || !payload.email || isTokenExpired(payload)) {
        logout();
        return;
      }
      
      userEmail = payload.email;
      authToken = token;
      
      updateAuthUI();
      loadPurchases();
      
    } catch (error) {
      logout();
    }
  } else {
    updateAuthUI();
  }
}

function updateAuthUI() {
  const authSection = document.getElementById('authSection');
  if (!authSection) return;
  
  if (authToken && userEmail) {
    const shortEmail = userEmail.length > 20 
      ? userEmail.substring(0, 17) + '...' 
      : userEmail.split('@')[0];
    
    authSection.innerHTML = `
      <div class="user-dropdown">
        <button class="btn btn-outline" id="userDropdown">
          <i class="fas fa-user-shield"></i>
          <span>${shortEmail}</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="dropdown-menu">
          <div class="dropdown-header">
            <strong>Premium Account</strong>
            <div class="dropdown-email">${userEmail}</div>
          </div>
          <button class="dropdown-item" onclick="viewMyDownloads()">
            <i class="fas fa-download"></i>
            My Downloads
          </button>
          <button class="dropdown-item" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>`;
    
    const dropdownBtn = document.getElementById('userDropdown');
    if (dropdownBtn) {
      dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.parentElement.classList.toggle('show');
      });
    }
    
    document.addEventListener('click', closeDropdown);
    
  } else {
    authSection.innerHTML = `
      <button class="btn btn-premium" onclick="openAuthModal()">
        <i class="fas fa-sign-in-alt"></i>
        Login
      </button>`;
  }
}

function closeDropdown() {
  const dropdown = document.querySelector('.user-dropdown');
  if (dropdown) {
    dropdown.classList.remove('show');
  }
}

function logout() {
  authToken = null;
  userEmail = null;
  userPurchases = {};
  
  removeTokenFromStorage();
  clearAuthCookie();
  
  updateAuthUI();
  loadProducts();
  
  showNotification('Logged out successfully', 'success');
}

// ===== AUTH MODAL FUNCTIONS =====
function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('authEmail')?.focus();
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  resetAuthForm();
}

function resetAuthForm() {
  const authEmail = document.getElementById('authEmail');
  const otpSection = document.getElementById('otpSection');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  
  if (authEmail) authEmail.value = '';
  if (otpSection) otpSection.classList.remove('show');
  if (sendOtpBtn) {
    sendOtpBtn.style.display = 'flex';
    sendOtpBtn.disabled = false;
    sendOtpBtn.innerHTML = '<i class="fas fa-paper-plane"></i> SEND VERIFICATION CODE';
  }
  if (verifyOtpBtn) {
    verifyOtpBtn.style.display = 'none';
    verifyOtpBtn.innerHTML = '<i class="fas fa-check-circle"></i> VERIFY & CONTINUE';
  }
  clearOTPInputs();
}

// ===== OTP FUNCTIONS =====
function setupOTPInputs() {
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('otp-input')) {
      const index = parseInt(e.target.dataset.index);
      const value = e.target.value;
      
      if (!/^\d*$/.test(value)) {
        e.target.value = '';
        return;
      }
      
      if (value && index < 5) {
        const nextInput = document.querySelector(`.otp-input[data-index="${index + 1}"]`);
        if (nextInput) nextInput.focus();
      }
      
      if (checkOTPCompletion()) {
        setTimeout(() => {
          const verifyBtn = document.getElementById('verifyOtpBtn');
          if (verifyBtn && verifyBtn.style.display !== 'none') {
            verifyOTP();
          }
        }, 100);
      }
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && e.target.classList.contains('otp-input')) {
      const index = parseInt(e.target.dataset.index);
      if (!e.target.value && index > 0) {
        const prevInput = document.querySelector(`.otp-input[data-index="${index - 1}"]`);
        if (prevInput) {
          prevInput.focus();
          prevInput.value = '';
        }
      }
    }
  });
}

function clearOTPInputs() {
  document.querySelectorAll('.otp-input').forEach(input => {
    input.value = '';
  });
}

function getOTPValue() {
  const inputs = document.querySelectorAll('.otp-input');
  return Array.from(inputs).map(input => input.value).join('');
}

function checkOTPCompletion() {
  const inputs = document.querySelectorAll('.otp-input');
  return Array.from(inputs).every(input => input.value.length === 1);
}

async function sendOTP() {
  const emailInput = document.getElementById('authEmail');
  const button = document.getElementById('sendOtpBtn');
  
  if (!emailInput || !button) return;
  
  const email = emailInput.value.trim();
  
  if (!validateEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    emailInput.focus();
    return;
  }
  
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';
  
  try {
    const response = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification('Verification code sent to your email', 'success');
      
      const otpSection = document.getElementById('otpSection');
      const verifyBtn = document.getElementById('verifyOtpBtn');
      
      if (otpSection) otpSection.classList.add('show');
      button.style.display = 'none';
      if (verifyBtn) verifyBtn.style.display = 'flex';
      
      setTimeout(() => {
        document.querySelector('.otp-input[data-index="0"]')?.focus();
      }, 100);
      
    } else {
      showNotification(data.error || 'Unable to send verification code', 'error');
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-paper-plane"></i> SEND VERIFICATION CODE';
    }
    
  } catch (error) {
    showNotification('Network error. Please check your connection.', 'error');
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-paper-plane"></i> SEND VERIFICATION CODE';
  }
}

async function verifyOTP() {
  const emailInput = document.getElementById('authEmail');
  const button = document.getElementById('verifyOtpBtn');
  
  if (!emailInput || !button) return;
  
  const email = emailInput.value.trim();
  const otp = getOTPValue();
  
  if (!validateOTP(otp)) {
    showNotification('Please enter the 6-digit code', 'warning');
    return;
  }
  
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFYING...';
  
  try {
    const response = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, otp }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      setTokenToStorage(data.token);
      
      const payload = decodeTokenPayload(data.token);
      userEmail = payload?.email || email;
      
      showNotification('Welcome to ZishanHack!', 'success');
      updateAuthUI();
      closeAuthModal();
      
      await loadPurchases();
      
    } else {
      showNotification(data.error || 'Invalid verification code', 'error');
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-check-circle"></i> VERIFY & CONTINUE';
      clearOTPInputs();
      document.querySelector('.otp-input[data-index="0"]')?.focus();
    }
    
  } catch (error) {
    showNotification('Network error. Please try again.', 'error');
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-check-circle"></i> VERIFY & CONTINUE';
  }
}

// ===== RAZORPAY SDK LOADING =====
function loadRazorpaySDK() {
  if (typeof Razorpay !== 'undefined') return;
  
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  document.head.appendChild(script);
}

function ensureRazorpaySDK(callback) {
  if (typeof Razorpay !== 'undefined') {
    callback();
    return;
  }
  
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    if (typeof Razorpay !== 'undefined') {
      clearInterval(checkInterval);
      callback();
    } else if (attempts >= 10) {
      clearInterval(checkInterval);
      showNotification('Payment system failed to load. Please refresh.', 'error');
    }
  }, 200);
}

// ===== PRODUCT FUNCTIONS =====
async function loadPurchases() {
  const token = getToken();
  
  if (!token) {
    userPurchases = {};
    loadProducts();
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/me/purchases`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      userPurchases = {};
      
      if (data.purchases && Array.isArray(data.purchases)) {
        data.purchases.forEach(purchase => {
          if (purchase.status && purchase.status.toLowerCase() === 'completed') {
            userPurchases[purchase.product_id] = true;
          }
        });
      }
      
      loadProducts();
      
    } else if (response.status === 401) {
      logout();
    }
  } catch (error) {
    console.error('Load purchases error:', error);
  }
}

function loadProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  
  const token = getToken();
  const isLoggedIn = !!token;
  
  container.innerHTML = '';
  
  PRODUCTS.forEach(product => {
    const isPurchased = userPurchases[product.id] === true;
    const productCard = createProductCard(product, isLoggedIn, isPurchased);
    container.appendChild(productCard);
  });
}

function formatPrice(amount) {
  return `$${amount}`;
}

function createProductCard(product, isLoggedIn, isPurchased) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  if (isLoggedIn && isPurchased) {
    card.classList.add('product-purchased');
  }
  
  const priceDisplay = formatPrice(product.price);
  const originalPriceDisplay = `$${product.originalPrice}`;
  
  card.innerHTML = `
    <div class="product-badges">
      ${product.badges.map(badge => `
        <span class="product-badge">${badge}</span>
      `).join('')}
    </div>
    
    <div class="product-icon" style="background: rgba(${hexToRgb(product.iconColor)}, 0.1);">
      <i class="${product.icon}" style="color: ${product.iconColor};"></i>
    </div>
    
    <h3 class="product-title">${product.name}</h3>
    <p class="product-description">${product.description}</p>
    
    <ul class="product-features">
      ${product.features.map(feature => `
        <li><i class="fas fa-check"></i> ${feature}</li>
      `).join('')}
    </ul>
    
    <div class="product-price">
      <span class="original-price">${originalPriceDisplay}</span>
      <div class="current-price">${priceDisplay}</div>
      <span class="discount-badge">${product.discount}</span>
      <div class="sales-count">
        <i class="fas fa-users"></i> ${product.salesCount} Sold
      </div>
    </div>
    
    <div class="product-actions">
      ${createProductButton(product.id, priceDisplay, isLoggedIn, isPurchased)}
    </div>
    
    <div class="product-guarantee">
      <i class="fas fa-shield-check"></i>
      <span>30-Day Money Back Guarantee • Instant Access • Lifetime Updates</span>
    </div>
  `;
  
  return card;
}

function createProductButton(productId, priceDisplay, isLoggedIn, isPurchased) {
  if (isLoggedIn && isPurchased) {
    return `
      <button class="btn btn-success" onclick="downloadProduct('${productId}')">
        <i class="fas fa-download"></i>
        DOWNLOAD NOW
      </button>
      <p class="purchase-note">✅ Already purchased • Click to download</p>`;
  } else {
    return `
      <button class="btn btn-premium btn-sparkle" onclick="buyProduct('${productId}')">
        <i class="fas fa-bolt"></i>
        GET INSTANT ACCESS - ${priceDisplay}
      </button>
      <p class="purchase-note">One-time payment • Lifetime access • 90% OFF</p>`;
  }
}

// ===== PAYMENT FUNCTIONS =====
async function buyProduct(productId) {
  ensureRazorpaySDK(() => {
    executeBuyProduct(productId);
  });
}

async function executeBuyProduct(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) {
    showNotification('Product not found', 'error');
    return;
  }
  
  let buyerEmail = userEmail;
  
  if (!buyerEmail) {
    try {
      buyerEmail = await promptForEmail(product.name, product.price);
      if (!buyerEmail) {
        showNotification('Email is required for purchase', 'warning');
        return;
      }
    } catch (error) {
      return;
    }
  }
  
  showLoading(true);
  showNotification(`Processing payment...`, 'info');
  
  try {
    const token = getToken();
    
    const response = await fetch(`${API_BASE}/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ 
        productId: productId, 
        email: buyerEmail
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok && data.razorpayOrderId) {
      showNotification('Opening payment gateway...', 'success');
      data.email = buyerEmail;
      
      setTimeout(() => {
        initializeRazorpayCheckout(data, product);
      }, 500);
      
    } else {
      showNotification(data.error || 'Payment initialization failed', 'error');
    }
  } catch (error) {
    showNotification('Network error. Please check your connection.', 'error');
  } finally {
    showLoading(false);
  }
}

async function promptForEmail(productName, price) {
  return new Promise((resolve) => {
    const modalHTML = `
      <div class="modal" id="emailModal">
        <div class="modal-overlay" onclick="closeEmailModal()"></div>
        <div class="modal-content">
          <button class="modal-close" onclick="closeEmailModal()">
            <i class="fas fa-times"></i>
          </button>
          <div class="auth-header">
            <div class="auth-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <h3>Complete Your Purchase</h3>
            <p>Enter your email for purchase receipt and account access</p>
          </div>
          <div class="auth-form">
            <div class="form-group">
              <input type="email" id="purchaseEmail" class="form-control email-input" 
                     placeholder="your.email@example.com" required autofocus>
            </div>
            <div class="purchase-details">
              <div class="detail-item">
                <span>Product:</span>
                <strong>${productName}</strong>
              </div>
              <div class="detail-item highlight">
                <span>Amount:</span>
                <strong>$${price} USD</strong>
              </div>
            </div>
            <button class="btn btn-premium btn-block" onclick="submitPurchaseEmail()">
              <i class="fas fa-lock"></i>
              CONTINUE TO PAYMENT
            </button>
          </div>
        </div>
      </div>`;
    
    const existingModal = document.getElementById('emailModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('emailModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      document.getElementById('purchaseEmail')?.focus();
    }, 50);
    
    window.closeEmailModal = () => {
      modal.remove();
      document.body.style.overflow = '';
      resolve(null);
    };
    
    window.submitPurchaseEmail = () => {
      const emailInput = document.getElementById('purchaseEmail');
      const email = emailInput?.value.trim();
      
      if (email && validateEmail(email)) {
        modal.remove();
        document.body.style.overflow = '';
        resolve(email);
      } else {
        showNotification('Please enter a valid email address', 'error');
        emailInput?.focus();
      }
    };
  });
}

function initializeRazorpayCheckout(orderData, product) {
  if (typeof Razorpay === 'undefined') {
    showNotification('Loading payment system...', 'info');
    setTimeout(() => initializeRazorpayCheckout(orderData, product), 1000);
    return;
  }
  
  const options = {
    key: orderData.key,
    amount: orderData.amount,
    currency: orderData.currency || 'USD',
    name: 'ZishanHack',
    description: product.name,
    order_id: orderData.razorpayOrderId,
    handler: function (response) {
      showNotification('Payment successful! Verifying...', 'success');
      
      verifyRazorpayPayment({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        order_id: orderData.orderId
      });
    },
    prefill: {
      email: userEmail || orderData.email || ''
    },
    theme: {
      color: '#6366f1'
    },
    modal: {
      ondismiss: function() {
        showNotification('Payment cancelled', 'warning');
      }
    }
  };
  
  try {
    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    showNotification('Payment system error. Please try again.', 'error');
  }
}

async function verifyRazorpayPayment(paymentData) {
  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showNotification('Payment verified successfully!', 'success');
      
      if (data.email && !userEmail) {
        userEmail = data.email;
      }
      
      if (data.token) {
        setTokenToStorage(data.token);
      }
      
      setTimeout(async () => {
        updateAuthUI();
        await loadPurchases();
        showNotification('Your purchase is now available!', 'success');
      }, 2000);
      
    } else {
      showNotification(data.error || 'Payment verification failed', 'error');
    }
  } catch (error) {
    showNotification('Network error during verification', 'error');
  } finally {
    showLoading(false);
  }
}

// ===== DOWNLOAD FUNCTIONS =====
async function downloadProduct(productId) {
  const token = getToken();
  
  if (!token) {
    showNotification('Please login to download', 'error');
    openAuthModal();
    return;
  }
  
  if (userPurchases[productId] !== true) {
    await loadPurchases();
    if (userPurchases[productId] !== true) {
      showNotification('You need to purchase this resource first', 'warning');
      return;
    }
  }
  
  showLoading(true);
  showNotification('Preparing download...', 'info');
  
  try {
    const response = await fetch(`${API_BASE}/api/download/${productId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        showNotification('Session expired. Please login again.', 'error');
      } else if (response.status === 403) {
        showNotification('Purchase verification failed.', 'warning');
        await loadPurchases();
      } else {
        showNotification('Download failed. Please try again.', 'error');
      }
      showLoading(false);
      return;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productId}.zip`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    
    showNotification('Download started!', 'success');
    
  } catch (error) {
    showNotification('Network error. Please try again.', 'error');
  } finally {
    showLoading(false);
  }
}

// ===== PAYMENT CALLBACK HANDLING =====
function checkPaymentCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  
  if (orderId) {
    window.history.replaceState({}, '', window.location.pathname);
    showNotification('Verifying your payment...', 'info');
    checkOrderStatus(orderId);
  }
}

async function checkOrderStatus(orderId) {
  if (!orderId) return;
  
  try {
    const response = await fetch(`${API_BASE}/purchase/status/${orderId}`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (response.ok) {
      if (data.status === 'completed' || data.status === 'paid') {
        showNotification('Payment verified! Your purchase is now available.', 'success');
        
        const token = getToken();
        if (token && userEmail === data.email) {
          setTimeout(async () => {
            await loadPurchases();
          }, 2000);
        } else {
          setTimeout(() => {
            showPostPurchasePrompt(data.email);
          }, 3000);
        }
      }
    }
  } catch (error) {
    console.error('Check order status error:', error);
  }
}

function showPostPurchasePrompt(email) {
  const modalHTML = `
    <div class="modal" id="postPurchaseModal">
      <div class="modal-overlay" onclick="closePostPurchaseModal()"></div>
      <div class="modal-content">
        <button class="modal-close" onclick="closePostPurchaseModal()">
          <i class="fas fa-times"></i>
        </button>
        <div class="auth-header">
          <div class="auth-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
            <i class="fas fa-gift"></i>
          </div>
          <h3>Purchase Successful!</h3>
          <p>Your payment was completed successfully!</p>
        </div>
        <div class="auth-form">
          <p style="text-align: center; color: var(--light); margin-bottom: 20px;">
            To access your purchased resources, please login with:
          </p>
          <div class="form-group">
            <input type="email" class="form-control" value="${email}" readonly style="text-align: center;">
          </div>
          <button class="btn btn-premium btn-block" onclick="loginAfterPurchase('${email}')">
            <i class="fas fa-sign-in-alt"></i>
            LOGIN TO ACCESS RESOURCES
          </button>
        </div>
      </div>
    </div>`;
  
  const existingModal = document.getElementById('postPurchaseModal');
  if (existingModal) existingModal.remove();
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = document.getElementById('postPurchaseModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  window.closePostPurchaseModal = () => {
    modal.remove();
    document.body.style.overflow = '';
  };
  
  window.loginAfterPurchase = (email) => {
    modal.remove();
    document.body.style.overflow = '';
    
    const authEmail = document.getElementById('authEmail');
    if (authEmail) authEmail.value = email;
    
    openAuthModal();
    
    setTimeout(() => {
      if (document.getElementById('sendOtpBtn')) {
        sendOTP();
      }
    }, 500);
  };
}

// ===== UTILITY FUNCTIONS =====
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateOTP(otp) {
  return /^\d{6}$/.test(otp);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '99, 102, 241';
}

function showLoading(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    if (show) {
      spinner.classList.add('show');
    } else {
      spinner.classList.remove('show');
    }
  }
}

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notificationText');
  const notificationIcon = document.getElementById('notificationIcon');
  
  if (!notification || !notificationText) return;
  
  if (notification.timeoutId) {
    clearTimeout(notification.timeoutId);
  }
  
  notification.className = 'notification';
  notification.classList.add(`notification-${type}`);
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  if (notificationIcon) {
    notificationIcon.className = `${icons[type] || icons.info} notification-icon`;
  }
  
  notificationText.textContent = message;
  notification.classList.add('show');
  
  if (type !== 'error') {
    notification.timeoutId = setTimeout(() => {
      hideNotification();
    }, 5000);
  }
}

function hideNotification() {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.classList.remove('show');
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
      notification.timeoutId = null;
    }
  }
}

function viewMyDownloads() {
  document.getElementById('resources').scrollIntoView({ behavior: 'smooth' });
  closeDropdown();
}

// ===== COUNTDOWN TIMER =====
function updateCountdown() {
  const countdownElement = document.getElementById('countdown');
  if (!countdownElement) return;
  
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const diff = endOfDay - now;
  
  if (diff <= 0) {
    countdownElement.textContent = '00:00:00';
    return;
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  countdownElement.textContent = 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ===== EXPORT FUNCTIONS TO GLOBAL SCOPE =====
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.logout = logout;
window.buyProduct = buyProduct;
window.downloadProduct = downloadProduct;
window.viewMyDownloads = viewMyDownloads;

// Start countdown timer
setInterval(updateCountdown, 1000);
updateCountdown();

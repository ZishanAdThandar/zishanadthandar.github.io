const API_BASE = window.location.hostname.includes('localhost') 
  ? 'http://localhost:8787' 
  : 'https://api.zishanhack.com';

let authToken = localStorage.getItem('zishanhack_token');
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

// Debug logging
console.log('ZishanHack initialized');
console.log('API Base:', API_BASE);
console.log('Initial auth token:', authToken ? 'Yes' : 'No');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  initializeAuth();
  loadProducts();
  checkPaymentCallback();
  setupOTPInputs();
  
  // Preload Razorpay SDK
  loadRazorpaySDK();
  
  // Debug: Check if purchases are loaded properly
  setTimeout(() => {
    console.log('Initial user purchases:', userPurchases);
  }, 1000);
});

// ===== RAZORPAY SDK LOADING =====
function loadRazorpaySDK() {
  if (typeof Razorpay !== 'undefined') {
    console.log('Razorpay SDK already loaded');
    return;
  }
  
  console.log('Loading Razorpay SDK...');
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => {
    console.log('✅ Razorpay SDK loaded successfully');
    window.razorpayLoaded = true;
  };
  script.onerror = (error) => {
    console.error('❌ Failed to load Razorpay SDK:', error);
    window.razorpayLoaded = false;
  };
  document.head.appendChild(script);
}

function ensureRazorpaySDK(callback) {
  if (typeof Razorpay !== 'undefined') {
    callback();
    return;
  }
  
  console.log('Waiting for Razorpay SDK to load...');
  showNotification('Loading payment system...', 'info');
  
  let attempts = 0;
  const maxAttempts = 5;
  
  const checkInterval = setInterval(() => {
    attempts++;
    
    if (typeof Razorpay !== 'undefined') {
      clearInterval(checkInterval);
      console.log('✅ Razorpay SDK loaded after', attempts, 'attempts');
      callback();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.error('❌ Razorpay SDK failed to load after', maxAttempts, 'attempts');
      showNotification('Payment system failed to load. Please refresh the page.', 'error');
    }
  }, 500);
}

// ===== AUTH FUNCTIONS =====
function initializeAuth() {
  console.log('Initializing auth...');
  
  if (authToken) {
    try {
      const tokenParts = authToken.split('.');
      if (tokenParts.length === 2) {
        const payload = JSON.parse(atob(tokenParts[0]));
        userEmail = payload.email;
        
        console.log('User email from token:', userEmail);
        
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          console.log('Token expired, logging out...');
          logout();
          return;
        }
        
        console.log('Token valid, updating UI and loading purchases...');
        updateAuthUI();
        loadPurchases();
      } else {
        console.log('Invalid token format, logging out...');
        logout();
      }
    } catch (error) {
      console.error('Auth error:', error);
      logout();
    }
  } else {
    console.log('No auth token found, showing login button...');
    updateAuthUI();
  }
}

function updateAuthUI() {
  const authSection = document.getElementById('authSection');
  if (!authSection) {
    console.log('Auth section not found');
    return;
  }
  
  console.log('Updating auth UI. Auth token:', authToken ? 'Yes' : 'No');
  console.log('User email:', userEmail);
  
  if (authToken && userEmail) {
    const shortEmail = userEmail.length > 20 
      ? userEmail.substring(0, 17) + '...' 
      : userEmail.split('@')[0];
    
    console.log('Showing logged in UI for:', shortEmail);
    
    authSection.innerHTML = `
      <div class="user-dropdown">
        <button class="btn btn-outline" id="userDropdown" aria-expanded="false">
          <i class="fas fa-user-shield"></i>
          <span>${shortEmail}</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="dropdown-menu" role="menu">
          <div class="dropdown-header">
            <strong>Premium Account</strong>
            <div class="dropdown-email">${userEmail}</div>
          </div>
          <button class="dropdown-item" onclick="viewMyDownloads()" role="menuitem">
            <i class="fas fa-download"></i>
            My Downloads
          </button>
          <button class="dropdown-item" onclick="logout()" role="menuitem">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
          <button class="dropdown-item" onclick="debugUserPurchases()" role="menuitem">
            <i class="fas fa-bug"></i>
            Debug Purchases
          </button>
        </div>
      </div>`;
    
    const dropdownBtn = document.getElementById('userDropdown');
    if (dropdownBtn) {
      dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isExpanded = this.parentElement.classList.toggle('show');
        this.setAttribute('aria-expanded', isExpanded);
      });
    }
    
    document.addEventListener('click', closeDropdown);
    
  } else {
    console.log('Showing login button');
    authSection.innerHTML = `
      <button class="btn btn-premium" onclick="openAuthModal()" aria-label="Login to account">
        <i class="fas fa-sign-in-alt"></i>
        Login
      </button>`;
  }
}

function closeDropdown() {
  const dropdown = document.querySelector('.user-dropdown');
  if (dropdown) {
    dropdown.classList.remove('show');
    const button = dropdown.querySelector('#userDropdown');
    if (button) button.setAttribute('aria-expanded', 'false');
  }
}

function logout() {
  console.log('Logging out...');
  authToken = null;
  userEmail = null;
  userPurchases = {};
  localStorage.removeItem('zishanhack_token');
  updateAuthUI();
  loadProducts();
  showNotification('Logged out successfully', 'success');
}

function viewMyDownloads() {
  document.getElementById('resources').scrollIntoView({ behavior: 'smooth' });
  closeDropdown();
}

// ===== AUTH MODAL FUNCTIONS =====
function openAuthModal() {
  console.log('Opening auth modal');
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('authEmail').focus();
  }
}

function closeAuthModal() {
  console.log('Closing auth modal');
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
    verifyOtpBtn.disabled = false;
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
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
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
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
      if (button) button.style.display = 'none';
      if (verifyBtn) verifyBtn.style.display = 'flex';
      
      setTimeout(() => {
        const firstOtpInput = document.querySelector('.otp-input[data-index="0"]');
        if (firstOtpInput) {
          firstOtpInput.focus();
          firstOtpInput.select();
        }
      }, 100);
      
    } else {
      showNotification(data.error || 'Unable to send verification code', 'error');
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-paper-plane"></i> SEND VERIFICATION CODE';
    }
    
  } catch (error) {
    console.error('OTP error:', error);
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
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, otp }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    console.log('OTP verify response:', data);
    
    if (response.ok) {
      authToken = data.token;
      userEmail = email;
      localStorage.setItem('zishanhack_token', authToken);
      
      showNotification('Welcome to ZishanHack!', 'success');
      updateAuthUI();
      closeAuthModal();
      
      // Force reload purchases immediately after login
      console.log('Login successful, loading purchases...');
      await loadPurchases();
      
    } else {
      showNotification(data.error || 'Invalid verification code', 'error');
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-check-circle"></i> VERIFY & CONTINUE';
      
      clearOTPInputs();
      const firstOtpInput = document.querySelector('.otp-input[data-index="0"]');
      if (firstOtpInput) {
        firstOtpInput.focus();
        firstOtpInput.select();
      }
    }
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    showNotification('Network error. Please try again.', 'error');
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-check-circle"></i> VERIFY & CONTINUE';
  }
}

// ===== PRODUCT FUNCTIONS =====
async function loadPurchases() {
  console.log('Loading purchases...');
  console.log('Auth token:', authToken ? 'Present' : 'Missing');
  
  if (!authToken) {
    console.log('No auth token, cannot load purchases');
    userPurchases = {};
    loadProducts();
    return;
  }
  
  try {
    console.log('Fetching purchases from API...');
    const response = await fetch(`${API_BASE}/api/me/purchases`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log('Purchases API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Raw purchases API data:', data);
      
      userPurchases = {};
      if (data.purchases && Array.isArray(data.purchases)) {
        console.log('Processing', data.purchases.length, 'purchases');
        
        data.purchases.forEach(purchase => {
          console.log('Purchase item:', purchase);
          console.log('Product ID:', purchase.product_id);
          console.log('Status:', purchase.status);
          
          // Check for completed purchase (case-insensitive)
          if (purchase.status && purchase.status.toLowerCase() === 'completed') {
            userPurchases[purchase.product_id] = true;
            console.log('✅ Added purchase for product:', purchase.product_id);
          } else {
            console.log('❌ Purchase not completed for:', purchase.product_id, 'Status:', purchase.status);
          }
        });
      } else {
        console.log('No purchases array in response');
      }
      
      console.log('Final userPurchases object:', userPurchases);
      console.log('Has ultimate_checklist?', userPurchases['ultimate_checklist']);
      
      // Force UI update with purchases
      loadProducts();
      
    } else if (response.status === 401) {
      console.log('Auth token expired, logging out');
      logout();
      showNotification('Session expired. Please login again.', 'error');
    } else {
      const errorText = await response.text();
      console.error('Purchases API error:', errorText);
      showNotification('Failed to load purchases', 'error');
    }
  } catch (error) {
    console.error('Load purchases error:', error);
    showNotification('Network error loading purchases', 'error');
  }
}

function loadProducts() {
  console.log('Loading products...');
  console.log('Current userPurchases:', userPurchases);
  
  const container = document.getElementById('productsContainer');
  if (!container) {
    console.log('Products container not found');
    return;
  }
  
  const isLoggedIn = !!authToken;
  console.log('User logged in:', isLoggedIn);
  
  container.innerHTML = '';
  
  PRODUCTS.forEach(product => {
    const isPurchased = userPurchases[product.id] === true;
    console.log(`Product ${product.id}: purchased = ${isPurchased}`);
    const productCard = createProductCard(product, isLoggedIn, isPurchased);
    container.appendChild(productCard);
  });
  
  console.log('Products loaded');
}

function formatPrice(amount) {
  return `$${amount}`;
}

function createProductCard(product, isLoggedIn, isPurchased) {
  console.log(`Creating card for ${product.id}:`);
  console.log('- isLoggedIn:', isLoggedIn);
  console.log('- isPurchased:', isPurchased);
  
  const card = document.createElement('div');
  card.className = 'product-card';
  
  if (isLoggedIn && isPurchased) {
    card.classList.add('product-purchased');
    console.log(`✅ ${product.id} marked as purchased`);
  } else {
    console.log(`❌ ${product.id} not purchased or not logged in`);
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
  console.log(`Creating button for ${productId}:`);
  console.log('- isLoggedIn:', isLoggedIn);
  console.log('- isPurchased:', isPurchased);
  
  if (isLoggedIn && isPurchased) {
    console.log(`✅ Showing download button for ${productId}`);
    return `
      <button class="btn btn-success" onclick="downloadProduct('${productId}')" aria-label="Download ${productId}">
        <i class="fas fa-download"></i>
        DOWNLOAD NOW
      </button>
      <p class="purchase-note">✅ Already purchased • Click to download</p>`;
  } else {
    console.log(`🛒 Showing buy button for ${productId}`);
    return `
      <button class="btn btn-premium btn-sparkle" onclick="buyProduct('${productId}')" aria-label="Buy ${productId} for ${priceDisplay}">
        <i class="fas fa-bolt"></i>
        GET INSTANT ACCESS - ${priceDisplay}
      </button>
      <p class="purchase-note">One-time payment • Lifetime access • 90% OFF • International Cards</p>`;
  }
}

// ===== PAYMENT FUNCTIONS =====
async function buyProduct(productId) {
  console.log('buyProduct called for:', productId);
  
  // First ensure Razorpay SDK is loaded
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
  
  // If not logged in, ask for email
  if (!buyerEmail) {
    try {
      buyerEmail = await promptForEmail(product.name, product.price);
      if (!buyerEmail) {
        showNotification('Email is required for purchase', 'warning');
        return;
      }
    } catch (error) {
      console.error('Email prompt error:', error);
      return;
    }
  }
  
  showLoading(true);
  showNotification(`Processing payment for ${product.name}...`, 'info');
  
  try {
    const response = await fetch(`${API_BASE}/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify({ 
        productId: productId, 
        email: buyerEmail,
        price: product.price
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (response.ok && data.razorpayOrderId) {
      showNotification('Opening payment gateway...', 'success');
      
      // Store the email in orderData for Razorpay prefill
      data.email = buyerEmail;
      
      // Give time for notification to show
      setTimeout(() => {
        console.log('Initializing Razorpay checkout with data:', data);
        initializeRazorpayCheckout(data, product);
      }, 500);
      
    } else {
      const errorMsg = data.error || 'Payment initialization failed';
      showNotification(`Payment Error: ${errorMsg}`, 'error');
      console.error('Payment error:', data);
    }
  } catch (error) {
    console.error('Payment request error:', error);
    showNotification('Network error. Please check your connection.', 'error');
  } finally {
    showLoading(false);
  }
}

async function promptForEmail(productName, price) {
  return new Promise((resolve) => {
    const modalHTML = `
      <div class="modal" id="emailModal" aria-hidden="true">
        <div class="modal-overlay" onclick="closeEmailModal()"></div>
        <div class="modal-content">
          <button class="modal-close" onclick="closeEmailModal()" aria-label="Close email modal">
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
              <label for="purchaseEmail">Email Address</label>
              <input type="email" id="purchaseEmail" class="form-control email-input" 
                     placeholder="your.email@example.com" required autofocus>
            </div>
            
            <div class="purchase-details">
              <div class="detail-item">
                <span>Product:</span>
                <strong>${productName}</strong>
              </div>
              <div class="detail-item highlight">
                <span>Payment Amount:</span>
                <strong class="price-highlight">$${price} USD</strong>
              </div>
            </div>
            
            <button class="btn btn-premium btn-block" onclick="submitPurchaseEmail()" aria-label="Continue to payment">
              <i class="fas fa-lock"></i>
              CONTINUE TO SECURE PAYMENT
            </button>
          </div>
        </div>
      </div>`;
    
    const existingModal = document.getElementById('emailModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('emailModal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus on email input
    setTimeout(() => {
      const emailInput = document.getElementById('purchaseEmail');
      if (emailInput) {
        emailInput.focus();
        emailInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            submitPurchaseEmail();
          }
        });
      }
    }, 50);
    
    window.closeEmailModal = () => {
      const modal = document.getElementById('emailModal');
      if (modal) {
        modal.remove();
        document.body.style.overflow = '';
      }
      resolve(null);
    };
    
    window.submitPurchaseEmail = () => {
      const emailInput = document.getElementById('purchaseEmail');
      if (!emailInput) return;
      
      const email = emailInput.value.trim();
      if (validateEmail(email)) {
        const modal = document.getElementById('emailModal');
        if (modal) {
          modal.remove();
          document.body.style.overflow = '';
        }
        resolve(email);
      } else {
        showNotification('Please enter a valid email address', 'error');
        emailInput.focus();
        emailInput.select();
      }
    };
  });
}

function initializeRazorpayCheckout(orderData, product) {
  console.log('initializeRazorpayCheckout called');
  console.log('Razorpay available:', typeof Razorpay !== 'undefined');
  console.log('Order data:', orderData);
  
  if (typeof Razorpay === 'undefined') {
    console.error('Razorpay SDK not loaded');
    showNotification('Loading payment system...', 'info');
    
    // Try to load Razorpay SDK again
    loadRazorpaySDK();
    
    // Retry after SDK loads
    setTimeout(() => {
      if (typeof Razorpay !== 'undefined') {
        initializeRazorpayCheckout(orderData, product);
      } else {
        showNotification('Failed to load payment system. Please refresh the page.', 'error');
      }
    }, 2000);
    return;
  }
  
  const options = {
    key: orderData.key,
    amount: orderData.amount,
    currency: orderData.currency || 'USD',
    name: 'ZishanHack',
    description: product.name,
    order_id: orderData.razorpayOrderId,
    image: 'https://zishanhack.com/logo.png',
    
    handler: function (response) {
      console.log('✅ Payment successful:', response);
      showNotification('Payment successful! Verifying...', 'success');
      
      const paymentData = {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        order_id: orderData.orderId
      };
      
      verifyRazorpayPayment(paymentData);
    },
    
    prefill: {
      email: userEmail || orderData.email || '',
      contact: '',
      name: ''
    },
    
    notes: {
      order_id: orderData.orderId,
      product_name: product.name,
      product_id: product.id
    },
    
    theme: {
      color: '#6366f1',
      backdrop_color: '#0a0e17'
    },
    
    modal: {
      ondismiss: function() {
        console.log('Payment modal dismissed');
        showNotification('Payment cancelled', 'warning');
      },
      escape: false,
      backdropclose: false,
      animation: true
    },
    
    timeout: 900,
    retry: {
      enabled: true,
      max_count: 3
    }
  };
  
  console.log('Razorpay options:', options);
  
  try {
    const rzp = new Razorpay(options);
    
    rzp.on('payment.failed', function(response) {
      console.error('❌ Payment failed:', response.error);
      const errorMsg = response.error.description || response.error.reason || 'Payment failed';
      showNotification(`Payment failed: ${errorMsg}`, 'error');
    });
    
    rzp.on('error', function(error) {
      console.error('❌ Razorpay error:', error);
      showNotification('Payment system error. Please try again.', 'error');
    });
    
    console.log('Opening Razorpay modal...');
    
    // Try to open the modal
    try {
      rzp.open();
      console.log('✅ Razorpay modal opened successfully');
    } catch (openError) {
      console.error('❌ Error opening Razorpay modal:', openError);
      
      // Fallback: Try alternative opening method
      showNotification('Opening payment window...', 'info');
      
      const fallbackHTML = `
        <div class="modal" id="razorpayFallbackModal">
          <div class="modal-overlay" onclick="closeRazorpayFallback()"></div>
          <div class="modal-content">
            <button class="modal-close" onclick="closeRazorpayFallback()">
              <i class="fas fa-times"></i>
            </button>
            <div class="auth-header">
              <div class="auth-icon">
                <i class="fas fa-credit-card"></i>
              </div>
              <h3>Complete Payment</h3>
              <p>Click the button below to complete your payment</p>
            </div>
            <div class="auth-form">
              <button class="btn btn-premium btn-block" onclick="retryRazorpayOpen()">
                <i class="fas fa-external-link-alt"></i>
                OPEN PAYMENT PAGE
              </button>
              <p class="text-center mt-3" style="color: var(--gray);">
                If payment window doesn't open, check your popup blocker
              </p>
            </div>
          </div>
        </div>`;
      
      const existingFallback = document.getElementById('razorpayFallbackModal');
      if (existingFallback) existingFallback.remove();
      
      document.body.insertAdjacentHTML('beforeend', fallbackHTML);
      
      const fallbackModal = document.getElementById('razorpayFallbackModal');
      fallbackModal.classList.add('show');
      
      window.closeRazorpayFallback = () => {
        fallbackModal.remove();
      };
      
      window.retryRazorpayOpen = () => {
        try {
          rzp.open();
          fallbackModal.remove();
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
          showNotification('Please allow popups for this site', 'error');
        }
      };
    }
    
  } catch (error) {
    console.error('❌ Razorpay init error:', error);
    showNotification('Payment system error. Please try again.', 'error');
  }
}

async function verifyRazorpayPayment(paymentData) {
  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    console.log('Payment verification response:', data);
    
    if (response.ok && data.success) {
      showNotification('Payment verified successfully!', 'success');
      
      if (data.email && !userEmail) {
        userEmail = data.email;
      }
      
      if (data.token && !authToken) {
        authToken = data.token;
        localStorage.setItem('zishanhack_token', authToken);
      }
      
      // Force reload purchases after successful payment
      setTimeout(async () => {
        updateAuthUI();
        await loadPurchases();
        showNotification('Your purchase is now available!', 'success');
      }, 2000);
      
    } else {
      showNotification(data.error || 'Payment verification failed', 'error');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    showNotification('Network error during verification', 'error');
  } finally {
    showLoading(false);
  }
}

// ===== DOWNLOAD FUNCTIONS =====
async function downloadProduct(productId) {
  console.log('Download product called:', productId);
  console.log('Auth token:', authToken ? 'Present' : 'Missing');
  console.log('User purchases:', userPurchases);
  console.log('Has purchase for this product:', userPurchases[productId]);
  
  if (!authToken) {
    showNotification('Please login to download', 'error');
    openAuthModal();
    return;
  }
  
  // Double-check purchase status before attempting download
  if (userPurchases[productId] !== true) {
    console.log('Purchase not found in local state, checking with server...');
    
    // Force reload purchases to ensure we have latest data
    await loadPurchases();
    
    if (userPurchases[productId] !== true) {
      showNotification('You need to purchase this resource first', 'warning');
      
      // Show debug info
      console.log('All purchases after reload:', userPurchases);
      console.log('Looking for product:', productId);
      console.log('Found:', userPurchases[productId]);
      
      return;
    }
  }
  
  console.log('Purchase verified, starting download...');
  showLoading(true);
  showNotification('Preparing download...', 'info');
  
  try {
    const response = await fetch(`${API_BASE}/api/download/${productId}`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`
      },
      credentials: 'include'
    });
    
    console.log('Download response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 403) {
        showNotification('Purchase verification failed.', 'warning');
        // Refresh purchases in case status changed
        await loadPurchases();
      } else if (response.status === 401) {
        showNotification('Session expired. Please login again.', 'error');
        logout();
      } else {
        const errorText = await response.text();
        console.error('Download error response:', errorText);
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
    console.error('Download error:', error);
    showNotification('Network error. Please try again.', 'error');
  } finally {
    showLoading(false);
  }
}

// ===== UTILITY FUNCTIONS =====
function checkPaymentCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  const success = urlParams.get('success');
  
  if (orderId) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    
    showNotification('Verifying your payment...', 'info');
    checkOrderStatus(orderId);
    
    if (success === 'true') {
      setTimeout(() => {
        showNotification('Payment successful! Processing your order...', 'success');
      }, 1000);
    }
  }
}

async function checkOrderStatus(orderId) {
  if (!orderId) return;
  
  try {
    const response = await fetch(`${API_BASE}/purchase/status/${orderId}`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    console.log('Order status check:', data);
    
    if (response.ok) {
      if (data.status === 'completed' || data.status === 'paid') {
        showNotification('Payment verified! Your purchase is now available.', 'success');
        
        if (authToken && userEmail === data.email) {
          setTimeout(async () => {
            await loadPurchases();
          }, 2000);
        } else {
          setTimeout(() => {
            showPostPurchasePrompt(data.email);
          }, 3000);
        }
      } else if (data.status === 'pending') {
        showNotification('Payment is being processed. Please wait...', 'info');
      } else {
        showNotification('Payment failed or was cancelled', 'error');
      }
    }
  } catch (error) {
    console.error('Check order status error:', error);
  }
}

function showPostPurchasePrompt(email) {
  const modalHTML = `
    <div class="modal" id="postPurchaseModal" aria-hidden="true">
      <div class="modal-overlay" onclick="closePostPurchaseModal()"></div>
      <div class="modal-content">
        <button class="modal-close" onclick="closePostPurchaseModal()" aria-label="Close modal">
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
            To access your purchased resources, please login with the email used for purchase:
          </p>
          
          <div class="form-group">
            <input type="email" class="form-control" value="${email}" readonly style="text-align: center;" aria-label="Purchase email">
          </div>
          
          <button class="btn btn-premium btn-block" onclick="loginAfterPurchase('${email}')" aria-label="Login with ${email}">
            <i class="fas fa-sign-in-alt"></i>
            LOGIN TO ACCESS RESOURCES
          </button>
          
          <p style="text-align: center; color: var(--gray); font-size: 14px; margin-top: 15px;">
            We'll send a verification code to this email
          </p>
        </div>
      </div>
    </div>`;
  
  const existingModal = document.getElementById('postPurchaseModal');
  if (existingModal) existingModal.remove();
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = document.getElementById('postPurchaseModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  window.closePostPurchaseModal = () => {
    modal.remove();
    document.body.style.overflow = '';
  };
  
  window.loginAfterPurchase = (email) => {
    modal.remove();
    document.body.style.overflow = '';
    
    const authEmail = document.getElementById('authEmail');
    if (authEmail) {
      authEmail.value = email;
    }
    
    openAuthModal();
    
    setTimeout(() => {
      if (document.getElementById('sendOtpBtn')) {
        sendOTP();
      }
    }, 500);
  };
}

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
      spinner.setAttribute('aria-hidden', 'false');
    } else {
      spinner.classList.remove('show');
      spinner.setAttribute('aria-hidden', 'true');
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
  notification.setAttribute('aria-live', 'assertive');
  
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
    notification.setAttribute('aria-live', 'off');
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
      notification.timeoutId = null;
    }
  }
}

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

// ===== DEBUG FUNCTIONS =====
function debugUserPurchases() {
  console.log('=== DEBUG USER PURCHASES ===');
  console.log('Auth Token:', authToken ? 'Present' : 'Missing');
  console.log('User Email:', userEmail);
  console.log('Current Purchases:', userPurchases);
  
  PRODUCTS.forEach(product => {
    console.log(`${product.id}: ${userPurchases[product.id] ? '✅ Purchased' : '❌ Not Purchased'}`);
  });
  
  // Force reload purchases
  console.log('Forcing purchase reload...');
  loadPurchases();
  
  console.log('=== END DEBUG ===');
  showNotification('Debug info logged to console. Press F12 to view.', 'info');
}

function forceRefreshPurchases() {
  console.log('Forcing purchase refresh...');
  loadPurchases();
  showNotification('Refreshing purchases...', 'info');
}

// ===== EXPORT FUNCTIONS TO GLOBAL SCOPE =====
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.logout = logout;
window.buyProduct = buyProduct;
window.downloadProduct = downloadProduct;
window.debugUserPurchases = debugUserPurchases;
window.forceRefreshPurchases = forceRefreshPurchases;

// Debug helper
window.debugRazorpay = function() {
  console.log('=== DEBUG RAZORPAY ===');
  console.log('Razorpay SDK loaded:', typeof Razorpay !== 'undefined');
  console.log('Auth token:', authToken ? 'Yes' : 'No');
  console.log('User email:', userEmail);
  console.log('API Base:', API_BASE);
  console.log('=== END DEBUG ===');
};

// Start countdown timer
setInterval(updateCountdown, 1000);
updateCountdown();

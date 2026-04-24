// script.js

// === 1. NAVIGATION & AUTHENTICATION HELPERS ===

/**
 * Checks client-side session storage for login status.
 * @returns {boolean} True if the user is considered logged in.
 */
function checkLoginStatus() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  }
  
  /**
  * Dynamically updates the navbar to show LOGIN/SIGNUP/REGISTER when logged out,
  * or LOGOUT when logged in.
  */
  function updateNav() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;
  
    const isLoggedIn = checkLoginStatus();
    
    // Define the fixed structural links
    let baseLinks = `
        <li><a href="index.html" class="${window.location.pathname.includes('index.html') && !window.location.hash ? 'active' : ''}">HOME</a></li>
        <li><a href="index.html#services">SERVICES</a></li>
        <li><a href="orphanages.html" class="${window.location.pathname.includes('orphanages.html') || window.location.pathname.includes('orphanage_detail.html') ? 'active' : ''}">ORPHANAGES</a></li>
    `;
  
    // Dynamically add authentication links based on status
    if (isLoggedIn) {
        // Logged in: show LOGOUT
        navLinks.innerHTML = baseLinks + `<li><a href="backend/logout.php" class="logout-link">LOGOUT</a></li>`;
    } else {
        // Logged out: show LOGIN, SIGN UP, REGISTER
        const links = [
            { text: 'LOGIN', href: 'login.html', active: window.location.pathname.includes('login.html') },
            { text: 'SIGN UP', href: 'signup.html', active: window.location.pathname.includes('signup.html') },
            { text: 'REGISTER', href: 'register.html', active: window.location.pathname.includes('register.html') }
        ];
        navLinks.innerHTML = baseLinks + links.map(l => 
            `<li><a href="${l.href}" class="${l.active ? 'active' : ''}">${l.text}</a></li>`
        ).join('');
    }
  }
  
  
  // === 2. FORM SUBMISSION HANDLER (Fixes Login/Signup/Register Redirection) ===
  
  /**
  * Intercepts form submissions for authentication (login, signup, register)
  * to handle them via AJAX/Fetch, show a SweetAlert popup, and then redirect.
  */
  function handleFormSubmissions() {
    document.querySelectorAll('form').forEach(form => {
        const actionUrl = form.action;
        // Check only for the 3 authentication/registration forms
        const isAuthForm = actionUrl.includes('login.php') || actionUrl.includes('signup.php') || actionUrl.includes('register_orphanage.php');
  
        if (!isAuthForm) return;
  
        form.addEventListener('submit', function(e) {
            e.preventDefault(); 
            
            const isLogin = actionUrl.includes('login.php');
            const isSignup = actionUrl.includes('signup.php');
            const isRegister = actionUrl.includes('register_orphanage.php');
            
            fetch(actionUrl, {
                method: 'POST',
                body: new FormData(this)
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: 'Success!',
                        text: data.message,
                        icon: 'success',
                        confirmButtonText: 'Continue'
                    }).then(() => {
                        if (isLogin) {
                            sessionStorage.setItem('isLoggedIn', 'true');
                            sessionStorage.setItem('isOwner', 'false');
                            window.location.href = 'index.html';
                        } else if (isSignup) {
                            window.location.href = 'login.html';
                        } else if (isRegister) {
                            sessionStorage.setItem('isLoggedIn', 'true');
                            sessionStorage.setItem('isOwner', 'true');
                            window.location.href = 'index.html';
                        }
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: data.message,
                        icon: 'error',
                        confirmButtonText: 'Try Again'
                    });
                }
            })
            .catch(err => {
                Swal.fire({
                    title: 'Server Error',
                    text: 'A network error occurred. Please check the console and server status.',
                    icon: 'warning'
                });
                console.error(err);
            });
        });
    });
  
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('logout-link')) {
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('isOwner');
        }
    });
  }
  
  
  // === 3. ORPHANAGE DATA LOADING (for orphanages.html) ===
  
  /**
  * Fetches orphanage data and populates the grid on the orphanages.html page.
  */
  function populateOrphanageGrid() {
    const grid = document.getElementById('orphanage-grid');
    if (!grid) return; // Only run on orphanages.html
  
    fetch('backend/get_orphanages.php')
        .then(r => r.json())
        .then(res => {
            if (!res.success || res.data.length === 0) {
                grid.innerHTML = `<p>${res.message || 'No orphanages found.'}</p>`;
                return;
            }
            
            grid.innerHTML = '';
            res.data.forEach(o => {
                const card = document.createElement('div');
                card.className = 'orphanage-card';
                
                // Assuming needs_gist is set in your PHP
                const needsGist = o.needs_gist || 'No major needs listed.';
  
                card.innerHTML = `
                    <img src="https://via.placeholder.com/300x200?text=${encodeURIComponent(o.name)}" alt="${o.name}">
                    <h3>${o.name}</h3>
                    <p><strong>Address:</strong> ${o.location.substring(0, 50) + (o.location.length > 50 ? '...' : '')}</p>
                    <p><strong>Contact:</strong> ${o.contact_phone || o.contact_email || 'N/A'}</p>
                    <h4>Needs Gist:</h4>
                    <ul>
                        <li><i class="fas fa-check-circle"></i> ${needsGist}</li>
                    </ul>
                    <a href="orphanage_detail.html?id=${o.id}" class="btn-view-details">View Details</a>
                `;
                grid.appendChild(card);
            });
        })
        .catch(err => {
            console.error('Failed to load orphanages:', err);
            if (grid) grid.innerHTML = '<p>Failed to load orphanages. Check console for details.</p>';
        });
  }
  
  
  // === 4. ORPHANAGE DETAILS & DONATION HANDLING (Fixes View Details/Donate Button) ===
  
  /**
  * Fetches and displays the full details of a single orphanage on orphanage_detail.html.
  */
  function displayOrphanageDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const detailHeader = document.getElementById('detail-header');
    const detailContent = document.getElementById('detail-content');
    
    // Only run this function on the details page and if elements exist
    if (!detailHeader || !detailContent || !window.location.pathname.includes('orphanage_detail.html')) return;
  
    if (!id) {
        detailHeader.innerHTML = '<h2>Error</h2><p>Invalid orphanage ID.</p>';
        detailContent.innerHTML = '';
        return;
    }
  
    detailHeader.innerHTML = '<h2>Loading details...</h2>';
    detailContent.innerHTML = '';
  
  
    fetch(`backend/get_orphanage_details.php?id=${encodeURIComponent(id)}`)
        .then(r => r.json())
        .then(res => {
            if (!res.success || !res.data) {
                detailHeader.innerHTML = `<h2>Error</h2><p>${res.message || 'Orphanage not found.'}</p>`;
                return;
            }
            
            const o = res.data;
            // Your PHP file correctly returns needs as an array
            const needsList = o.needs && o.needs.length > 0
                ? o.needs.map(n => `<li><i class="fas fa-check-circle"></i> ${n}</li>`).join('')
                : '<li>No specific needs listed right now.</li>';
  
            // Populate the header content
            detailHeader.innerHTML = `
                <img src="https://via.placeholder.com/800x400?text=${encodeURIComponent(o.name)}" alt="${o.name}">
                <h2>${o.name}</h2>
                <p><strong>Location:</strong> <i class="fas fa-map-marker-alt"></i> ${o.location}</p>
                <p><strong>Contact:</strong> <i class="fas fa-phone"></i> ${o.contact_phone || 'N/A'} | <i class="fas fa-envelope"></i> ${o.contact_email || 'N/A'}</p>
                <p><strong>Children:</strong> ${o.children_count || 0} | <strong>Adults:</strong> ${o.adults_count || 0}</p>
            `;
            
            // Populate the main content, including the Donate form
            detailContent.innerHTML = `
                <h3>About Us</h3>
                <p>${o.about || 'No description provided.'}</p>
  
                <h3>Our Mission</h3>
                <p>${o.mission || 'No mission statement provided.'}</p>
  
                <h3>Current Needs</h3>
                <p>These are the items and support we currently require. Monetary donations are in INR:</p>
                <ul class="needs-list">
                    ${needsList}
                </ul>
  
                <h3>Monetary Donation (INR)</h3>
                <p>Help us fulfill our needs instantly by providing a monetary donation.</p>
  
                <form action="backend/donate.php" method="POST" class="donate-form" id="donate-form">
                    <input type="hidden" name="orphanage_id" value="${o.id}">
                    <div class="form-group">
                        <label for="amount">Amount (INR)</label>
                        <input type="number" step="1" min="1" name="amount" id="amount" placeholder="Minimum donation is ₹1" required />
                    </div>
                    <button type="submit" class="btn-donate">Donate Now</button>
                </form>
            `;
  
            // Attach event listener for the donation form
            const donateForm = document.getElementById('donate-form');
            if (donateForm) {
                donateForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    fetch(donateForm.action, {
                        method: 'POST',
                        body: new FormData(donateForm)
                    })
                    .then(r => r.text())
                    .then(msg => {
                        // Use SweetAlert for a better confirmation pop-up
                        Swal.fire({
                            title: 'Thank You!',
                            text: msg || 'Your donation has been processed successfully.',
                            icon: 'success',
                            confirmButtonText: 'Done'
                        });
                        donateForm.reset(); 
                    })
                    .catch(err => {
                        Swal.fire({
                            title: 'Error',
                            text: 'An error occurred during donation. Please ensure you are logged in.',
                            icon: 'error'
                        });
                        console.error(err);
                    });
                });
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            detailHeader.innerHTML = `<h2>Loading Error</h2><p>Could not load orphanage details. Check the Console (F12) for network errors.</p>`;
        });
  }
  
  
  // === 5. INITIALIZATION (RUNS WHEN PAGE LOADS) ===
  
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Update Navigation Bar
    updateNav();
    
    // 2. Attach handlers to Login/Signup/Register forms (Fixes Login/Redirect issue)
    handleFormSubmissions();
    
    // 3. Load orphanage data (if on orphanages.html)
    populateOrphanageGrid();
  
    // 4. Load details (if on orphanage_detail.html) <-- NEW CALL HERE
    displayOrphanageDetails();
  });
  
  
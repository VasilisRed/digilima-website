/**
 * DigiLima.com - Main JavaScript
 * Interactive functionality for the website
 */

(function() {
    'use strict';
    
    // =====================================================
    // GLOBAL VARIABLES
    // =====================================================
    
    let currentLang = 'en';
    const translations = {};
    
    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================
    
    /**
     * Debounce function to limit function calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Get element or elements by selector
     */
    function $(selector) {
        const elements = document.querySelectorAll(selector);
        return elements.length === 1 ? elements[0] : elements;
    }
    
    /**
     * Add event listener to multiple elements
     */
    function addEventListeners(elements, event, handler) {
        if (NodeList.prototype.isPrototypeOf(elements)) {
            elements.forEach(el => el.addEventListener(event, handler));
        } else {
            elements.addEventListener(event, handler);
        }
    }
    
    /**
     * Animate element with CSS classes
     */
    function animateElement(element, animationClass) {
        element.classList.add(animationClass);
        element.addEventListener('animationend', () => {
            element.classList.remove(animationClass);
        }, { once: true });
    }
    
    // =====================================================
    // LANGUAGE SWITCHING FUNCTIONALITY
    // =====================================================
    
    function initLanguageSwitcher() {
        const langToggles = $('.lang-toggle');
        const html = document.documentElement;
        
        // Get initial language from HTML attribute or default to 'en'
        currentLang = html.getAttribute('data-lang') || 'en';
        updateLanguageToggles();
        
        addEventListeners(langToggles, 'click', function(e) {
            e.preventDefault();
            const newLang = this.getAttribute('data-lang');
            
            if (newLang !== currentLang) {
                switchLanguage(newLang);
            }
        });
    }
    
    function switchLanguage(lang) {
        currentLang = lang;
        const html = document.documentElement;
        
        // Update HTML lang attribute
        html.setAttribute('lang', lang);
        html.setAttribute('data-lang', lang);
        
        // Update all translatable elements
        updateTranslatableElements(lang);
        
        // Update language toggles
        updateLanguageToggles();
        
        // Update form placeholders
        updateFormPlaceholders(lang);
        
        // Store language preference
        localStorage.setItem('digilima_lang', lang);
        
        // Update URL without page reload
        const url = new URL(window.location);
        if (lang === 'en') {
            url.searchParams.delete('lang');
        } else {
            url.searchParams.set('lang', lang);
        }
        history.replaceState(null, '', url.toString());
    }
    
    function updateTranslatableElements(lang) {
        const elements = $(`[data-${lang}]`);
        elements.forEach(element => {
            const translation = element.getAttribute(`data-${lang}`);
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Update meta tags
        const title = document.querySelector(`title[data-${lang}]`);
        if (title) {
            document.title = title.getAttribute(`data-${lang}`);
        }
        
        const metaDesc = document.querySelector(`meta[name="description"][data-${lang}]`);
        if (metaDesc) {
            metaDesc.setAttribute('content', metaDesc.getAttribute(`data-${lang}`));
        }
    }
    
    function updateLanguageToggles() {
        const langToggles = $('.lang-toggle');
        langToggles.forEach(toggle => {
            const toggleLang = toggle.getAttribute('data-lang');
            if (toggleLang === currentLang) {
                toggle.classList.add('active');
                toggle.classList.remove('btn-outline-secondary');
                toggle.classList.add('btn-primary');
            } else {
                toggle.classList.remove('active');
                toggle.classList.remove('btn-primary');
                toggle.classList.add('btn-outline-secondary');
            }
        });
    }
    
    function updateFormPlaceholders(lang) {
        const placeholderElements = $(`[data-placeholder-${lang}]`);
        placeholderElements.forEach(element => {
            const placeholder = element.getAttribute(`data-placeholder-${lang}`);
            if (placeholder) {
                element.placeholder = placeholder;
            }
        });
    }
    
    function initLanguageFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        const storedLang = localStorage.getItem('digilima_lang');
        
        if (langParam && ['en', 'el'].includes(langParam)) {
            switchLanguage(langParam);
        } else if (storedLang && ['en', 'el'].includes(storedLang)) {
            switchLanguage(storedLang);
        }
    }
    
    // =====================================================
    // FORM HANDLING
    // =====================================================
    
    function initContactForm() {
        const contactForm = $('.contact-form');
        if (!contactForm) return;
        
        contactForm.addEventListener('submit', handleFormSubmit);
        
        // Add real-time validation
        const requiredFields = contactForm.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        });
        
        // Email validation
        const emailField = contactForm.querySelector('input[type="email"]');
        if (emailField) {
            emailField.addEventListener('blur', validateEmail);
        }
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate form
        if (!validateForm(form)) {
            return;
        }
        
        // Check honeypot
        if (formData.get('website')) {
            showFormMessage('error', 'Form submission failed. Please try again.');
            return;
        }
        
        // Show loading state
        showFormLoading(form, true);
        
        // Prepare form data for API
        const submissionData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            budget: formData.get('budget'),
            projectType: formData.get('project-type'),
            message: formData.get('message'),
            consent: formData.get('consent') === 'on',
            website: formData.get('website') // honeypot
        };
        
        try {
            // Determine API endpoint
            const apiEndpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? '/api/contact' // For local development with proxy
                : '/api/contact'; // For production (adjust if deployed elsewhere)
            
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });
            
            const result = await response.json();
            
            showFormLoading(form, false);
            
            if (response.ok && result.success) {
                showFormMessage('success', result.message);
                form.reset();
                
                // Track successful form submission
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submission_success', {
                        'form_name': 'contact_form',
                        'project_type': submissionData.projectType,
                        'budget': submissionData.budget
                    });
                }
                
                // Announce to screen readers
                announceToScreenReader('Form submitted successfully. We\'ll get back to you soon!');
                
            } else {
                showFormMessage('error', result.error || 'Something went wrong. Please try again.');
                
                // Track form submission error
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submission_error', {
                        'form_name': 'contact_form',
                        'error': result.error || 'unknown_error'
                    });
                }
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            showFormLoading(form, false);
            
            // Show user-friendly error message
            const errorMessage = currentLang === 'el' 
                ? 'Υπήρξε σφάλμα κατά την αποστολή της φόρμας. Παρακαλώ δοκιμάστε ξανά ή επικοινωνήστε μαζί μας άμεσα στο hello@digilima.com.'
                : 'There was an error sending your message. Please try again or contact us directly at hello@digilima.com.';
            
            showFormMessage('error', errorMessage);
            
            // Track network error
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submission_network_error', {
                    'form_name': 'contact_form',
                    'error': error.message
                });
            }
        }
    }
    
    function validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!validateField({ target: field })) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = currentLang === 'el' ? 
                'Αυτό το πεδίο είναι υποχρεωτικό' : 
                'This field is required';
        } else if (field.type === 'email' && value && !isValidEmail(value)) {
            isValid = false;
            errorMessage = currentLang === 'el' ? 
                'Παρακαλώ εισάγετε έγκυρη διεύθυνση email' : 
                'Please enter a valid email address';
        }
        
        showFieldError(field, isValid, errorMessage);
        return isValid;
    }
    
    function validateEmail(e) {
        const field = e.target;
        const value = field.value.trim();
        
        if (value && !isValidEmail(value)) {
            const errorMessage = currentLang === 'el' ? 
                'Παρακαλώ εισάγετε έγκυρη διεύθυνση email' : 
                'Please enter a valid email address';
            showFieldError(field, false, errorMessage);
            return false;
        }
        
        showFieldError(field, true, '');
        return true;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showFieldError(field, isValid, message) {
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        
        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            if (errorDiv && message) {
                errorDiv.textContent = message;
            }
        }
    }
    
    function clearFieldError(e) {
        const field = e.target;
        field.classList.remove('is-invalid', 'is-valid');
    }
    
    function showFormLoading(form, loading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ${currentLang === 'el' ? 'Αποστολή...' : 'Sending...'}
            `;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
    
    function showFormMessage(type, message) {
        const form = $('.contact-form');
        let messagesDiv = form.querySelector('.form-messages');
        
        // Create messages container if it doesn't exist
        if (!messagesDiv) {
            messagesDiv = document.createElement('div');
            messagesDiv.className = 'form-messages mt-3';
            form.appendChild(messagesDiv);
        }
        
        // Clear existing messages
        messagesDiv.innerHTML = '';
        
        // Create and show new message
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        messagesDiv.appendChild(alertDiv);
        
        // Scroll to message
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-hide success messages after 10 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 10000);
        }
    }
    
    // =====================================================
    // NEWSLETTER FORM
    // =====================================================
    
    function initNewsletterForm() {
        const newsletterForm = $('.newsletter-form');
        if (!newsletterForm) return;
        
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
    
    function handleNewsletterSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Validate email
        if (!emailInput.value || !isValidEmail(emailInput.value)) {
            emailInput.focus();
            return;
        }
        
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = currentLang === 'el' ? 'Εγγραφή...' : 'Subscribing...';
        submitBtn.disabled = true;
        
        // Simulate submission
        setTimeout(() => {
            submitBtn.textContent = currentLang === 'el' ? 'Επιτυχής εγγραφή!' : 'Subscribed!';
            submitBtn.classList.remove('btn-light');
            submitBtn.classList.add('btn-success');
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('btn-success');
                submitBtn.classList.add('btn-light');
                submitBtn.disabled = false;
                form.reset();
            }, 3000);
        }, 1000);
    }
    
    // =====================================================
    // PORTFOLIO FILTERING
    // =====================================================
    
    function initPortfolioFilter() {
        const filterButtons = $('.portfolio-filter');
        const portfolioItems = $('.portfolio-item');
        
        if (filterButtons.length === 0) return;
        
        addEventListeners(filterButtons, 'click', function(e) {
            e.preventDefault();
            
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items
            filterPortfolioItems(portfolioItems, filter);
        });
    }
    
    function filterPortfolioItems(items, filter) {
        items.forEach(item => {
            const shouldShow = filter === '*' || item.classList.contains(filter.replace('.', ''));
            
            if (shouldShow) {
                item.style.display = 'block';
                animateElement(item, 'fade-in');
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // =====================================================
    // BLOG FUNCTIONALITY
    // =====================================================
    
    function initBlogFilter() {
        const categoryFilters = $('.category-filter');
        const blogItems = $('.blog-item');
        
        if (categoryFilters.length === 0) return;
        
        addEventListeners(categoryFilters, 'click', function(e) {
            e.preventDefault();
            
            const category = this.getAttribute('data-category');
            
            // Update active button
            categoryFilters.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter blog items
            filterBlogItems(blogItems, category);
        });
    }
    
    function filterBlogItems(items, category) {
        items.forEach(item => {
            const itemCategories = item.getAttribute('data-categories');
            const shouldShow = category === '*' || 
                (itemCategories && itemCategories.includes(category));
            
            if (shouldShow) {
                item.style.display = 'block';
                animateElement(item, 'fade-in');
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    function initBlogSearch() {
        const searchInput = $('#blogSearch');
        if (!searchInput) return;
        
        const debouncedSearch = debounce((query) => {
            searchBlogPosts(query);
        }, 300);
        
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }
    
    function searchBlogPosts(query) {
        const blogItems = $('.blog-item');
        const searchTerm = query.toLowerCase().trim();
        
        blogItems.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const excerpt = item.querySelector('p').textContent.toLowerCase();
            const shouldShow = !searchTerm || 
                title.includes(searchTerm) || 
                excerpt.includes(searchTerm);
            
            if (shouldShow) {
                item.style.display = 'block';
                animateElement(item, 'fade-in');
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // =====================================================
    // LOAD MORE FUNCTIONALITY
    // =====================================================
    
    function initLoadMore() {
        const loadMoreBtns = $('.load-more-btn, .load-more-posts');
        
        addEventListeners(loadMoreBtns, 'click', function(e) {
            e.preventDefault();
            
            const btn = this;
            const originalText = btn.textContent;
            
            // Show loading state
            btn.textContent = currentLang === 'el' ? 'Φόρτωση...' : 'Loading...';
            btn.disabled = true;
            
            // Simulate loading more content
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                
                // In a real implementation, you would load more content here
                console.log('Load more functionality would be implemented here');
            }, 1000);
        });
    }
    
    // =====================================================
    // SMOOTH SCROLLING
    // =====================================================
    
    function initSmoothScrolling() {
        const scrollLinks = $('a[href^="#"]');
        
        addEventListeners(scrollLinks, 'click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') {
                e.preventDefault();
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                const offsetTop = target.offsetTop - 100; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // =====================================================
    // NAVBAR SCROLL EFFECT
    // =====================================================
    
    function initNavbarScrollEffect() {
        const navbar = $('.navbar');
        if (!navbar) return;
        
        const handleScroll = debounce(() => {
            if (window.scrollY > 100) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        }, 10);
        
        window.addEventListener('scroll', handleScroll);
    }
    
    // =====================================================
    // CAROUSEL/SLIDER FUNCTIONALITY
    // =====================================================
    
    function initCustomCarousels() {
        // Auto-play testimonials carousel
        const testimonialsCarousel = document.querySelector('#testimonialsCarousel');
        if (testimonialsCarousel) {
            const carousel = new bootstrap.Carousel(testimonialsCarousel, {
                interval: 5000,
                wrap: true,
                pause: 'hover'
            });
        }
    }
    
    // =====================================================
    // ANALYTICS TRACKING
    // =====================================================
    
    function initAnalyticsTracking() {
        // Track form submissions
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        'form_name': form.className || 'unknown_form'
                    });
                }
            });
        });
        
        // Track CTA button clicks
        const ctaButtons = document.querySelectorAll('.btn-primary');
        ctaButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'cta_click', {
                        'button_text': btn.textContent.trim()
                    });
                }
            });
        });
        
        // Track language switches
        const langToggles = $('.lang-toggle');
        addEventListeners(langToggles, 'click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'language_switch', {
                    'language': this.getAttribute('data-lang')
                });
            }
        });
    }
    
    // =====================================================
    // ACCESSIBILITY IMPROVEMENTS
    // =====================================================
    
    function initA11yImprovements() {
        // Add keyboard navigation for custom dropdowns
        const dropdowns = $('.dropdown-toggle');
        addEventListeners(dropdowns, 'keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // Add focus indicators for card links
        const cardLinks = document.querySelectorAll('.card a, .portfolio-card a, .blog-card a');
        cardLinks.forEach(link => {
            link.addEventListener('focus', function() {
                this.closest('.card, .portfolio-card, .blog-card').classList.add('focus-within');
            });
            
            link.addEventListener('blur', function() {
                this.closest('.card, .portfolio-card, .blog-card').classList.remove('focus-within');
            });
        });
        
        // Announce dynamic content changes to screen readers
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    }
    
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    // =====================================================
    // PERFORMANCE OPTIMIZATIONS
    // =====================================================
    
    function initPerformanceOptimizations() {
        // Lazy load images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            lazyImages.forEach(img => imageObserver.observe(img));
        }
        
        // Preload critical resources
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'font';
        preloadLink.crossOrigin = 'anonymous';
        preloadLink.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2';
        document.head.appendChild(preloadLink);
    }
    
    // =====================================================
    // UTILITY FUNCTIONS FOR YEAR UPDATE
    // =====================================================
    
    function updateCopyrightYear() {
        const yearSpan = $('#current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
    }
    
    // =====================================================
    // INITIALIZATION
    // =====================================================
    
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Initialize all functionality
        initLanguageFromURL();
        initLanguageSwitcher();
        initContactForm();
        initNewsletterForm();
        initPortfolioFilter();
        initBlogFilter();
        initBlogSearch();
        initLoadMore();
        initSmoothScrolling();
        initNavbarScrollEffect();
        initCustomCarousels();
        initAnalyticsTracking();
        initA11yImprovements();
        initPerformanceOptimizations();
        updateCopyrightYear();
        
        // Add loaded class to body for CSS transitions
        document.body.classList.add('loaded');
        
        console.log('DigiLima.com JavaScript initialized successfully');
    }
    
    // Start initialization
    init();
    
})();
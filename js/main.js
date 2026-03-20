/**
 * Main JS - Initialize all modules
 */

const ASSET_VERSION = '20260320_6';
const CONTENT_URL = `data/content.json?v=${ASSET_VERSION}`;

import ThemeManager from './theme.js?v=20260320_6';
import NavigationManager from './navigation.js?v=20260320_6';
import AnimationManager from './animations.js?v=20260320_6';
import SkillBars from './components/skillBars.js?v=20260320_6';
import ProjectCards from './components/projectCards.js?v=20260320_6';
import Typewriter from './components/typewriter.js?v=20260320_6';
import MeteorShower from './meteorShower.js?v=20260320_6';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Theme manager disabled to force dark space theme
    // const themeManager = new ThemeManager();

    // Initialize navigation manager
    const navigationManager = new NavigationManager();

    // Initialize animation manager
    const animationManager = new AnimationManager();

    // Initialize canvas meteor shower background
    const meteorShower = new MeteorShower('meteor-canvas');
    meteorShower.init();

    // Initialize typewriter effect
    const typewriter = new Typewriter('tw', [
        'Software & Cloud Engineer',
        'Problem Solver',
        'Full-Stack Developer',
        'AWS Enthusiast',
        'Lifelong Learner'
    ], {
        typeSpeed: 100,
        deleteSpeed: 50,
        delayBetweenTexts: 2000,
        loop: true
    });
    typewriter.init();

    // Initialize skill bars
    const skillBars = new SkillBars('skillsGrid');
    skillBars.init();

    // Initialize project cards
    const projectCards = new ProjectCards('projectsGrid', 'projectFilters');
    projectCards.init();

    // Load experience timeline
    loadTimeline('experienceTimeline', 'experience');

    // Load education timeline
    loadTimeline('educationTimeline', 'education');

    // Load achievements
    loadAchievements();

    // Initialize contact form
    initContactForm();

    // Initialize Profile Photo Uploader
    initProfileUploader();
});

/**
 * Initialize Profile Photo Uploader
 */
function initProfileUploader() {
    const fileInput = document.getElementById('profile-upload');
    const profileImg = document.getElementById('profile-img');

    if (fileInput && profileImg) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImg.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }
}

/**
 * Load timeline data (experience or education)
 */
async function loadTimeline(containerId, dataKey) {
    try {
        const response = await fetch(CONTENT_URL, { cache: 'no-store' });
        const data = await response.json();
        const items = data[dataKey];
        const container = document.getElementById(containerId);

        if (!container) return;

        container.innerHTML = items.map(item => `
            <div class="timeline-item reveal">
                <span class="timeline-date">${item.period}</span>
                <h3 class="timeline-title">${item.degree || item.title}</h3>
                <p class="timeline-subtitle">${item.institution || item.company}</p>
                <p class="timeline-description">${item.description}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error(`Error loading ${dataKey}:`, error);
    }
}

/**
 * Load achievements data
 */
async function loadAchievements() {
    try {
        const response = await fetch(CONTENT_URL, { cache: 'no-store' });
        const data = await response.json();
        const achievements = data.achievements;
        const container = document.getElementById('achievementsGrid');

        if (!container) return;

        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-card reveal">
                <div class="achievement-icon">${achievement.icon}</div>
                <h3 class="achievement-title">${achievement.title}</h3>
                <p class="achievement-description">${achievement.description}</p>
            </div>
        `).join('');

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
        );

        container.querySelectorAll('.achievement-card').forEach(card => {
            observer.observe(card);
        });
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
}

/**
 * Initialize contact form with validation and submission
 */
function initContactForm() {
    const form = document.getElementById('contactForm');
    const formAction = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScDIPqrubh3bVKTUc-AIPBKIdYnynZYi_nhi1ERtFDbzbvd6Q/formResponse';
    const submitButton = form ? form.querySelector('.submit-btn') : null;

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (submitButton?.classList.contains('is-loading')) {
            return;
        }

        setSubmitLoadingState(submitButton, true);

        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            institute: document.getElementById('institute').value,
            subject: document.getElementById('subject').value,
            suggestions: document.getElementById('suggestions').value,
            rating: document.querySelector('input[name="rating"]:checked')?.value || ''
        };

        // Validate form
        if (!validateForm(formData)) {
            setSubmitLoadingState(submitButton, false);
            return;
        }

        submitToGoogleForm(
            formAction,
            {
                'entry.436790427': formData.name,
                'entry.1826983457': formData.email,
                'entry.1398257962': formData.institute,
                'entry.2023186783': formData.subject,
                'entry.2090854412': formData.suggestions,
                'entry.1185156895': formData.rating
            },
            () => {
                showFormMessage('success', 'Thanks for your response!');
                form.reset();
                setSubmitLoadingState(submitButton, false);
            },
            (error) => {
                console.error('Error submitting form:', error);
                showFormMessage('error', 'Sorry, something went wrong. Please try again.');
                setSubmitLoadingState(submitButton, false);
            }
        );
    });
}

function setSubmitLoadingState(button, isLoading) {
    if (!button) return;

    button.classList.toggle('is-loading', isLoading);
    button.disabled = isLoading;
}

function submitToGoogleForm(actionUrl, fields, onSuccess, onError) {
    const iframeName = 'google-form-target';
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';

    const form = document.createElement('form');
    form.action = actionUrl;
    form.method = 'POST';
    form.target = iframeName;

    Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    });

    const fvv = document.createElement('input');
    fvv.type = 'hidden';
    fvv.name = 'fvv';
    fvv.value = '1';
    form.appendChild(fvv);

    const pageHistory = document.createElement('input');
    pageHistory.type = 'hidden';
    pageHistory.name = 'pageHistory';
    pageHistory.value = '0';
    form.appendChild(pageHistory);

    const fbzx = document.createElement('input');
    fbzx.type = 'hidden';
    fbzx.name = 'fbzx';
    fbzx.value = String(Date.now());
    form.appendChild(fbzx);

    let hasSubmitted = false;
    const cleanup = () => {
        iframe.removeEventListener('load', handleLoad);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        if (form.parentNode) form.parentNode.removeChild(form);
    };

    const handleLoad = () => {
        if (!hasSubmitted) return;
        cleanup();
        onSuccess();
    };

    iframe.addEventListener('load', handleLoad);
    document.body.appendChild(iframe);
    document.body.appendChild(form);

    try {
        hasSubmitted = true;
        form.submit();

        setTimeout(() => {
            if (hasSubmitted && iframe.isConnected) {
                cleanup();
                onSuccess();
            }
        }, 1500);
    } catch (error) {
        cleanup();
        onError(error);
    }
}

/**
 * Validate contact form
 */
function validateForm(data) {
    let isValid = true;

    // Name validation
    if (data.name.trim().length < 2) {
        showFieldError('name', 'Please enter a valid name');
        isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    // Subject validation
    if (data.subject.trim().length < 3) {
        showFieldError('subject', 'Please enter a subject');
        isValid = false;
    }

    // Suggestions validation
    if (data.suggestions.trim().length < 2) {
        showFieldError('suggestions', 'Please enter your suggestions');
        isValid = false;
    }

    // Institute validation
    if (data.institute.trim().length < 2) {
        showFieldError('institute', 'Please enter your institute/organization');
        isValid = false;
    }

    // Rating validation
    if (!data.rating) {
        showFieldError('ratingOptions', 'Please select a rating');
        isValid = false;
    }

    return isValid;
}

/**
 * Show field error
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error');
        setTimeout(() => field.classList.remove('error'), 3000);
    }
}

/**
 * Show form message
 */
function showFormMessage(type, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--color-lime)' : 'var(--color-coral)'};
        color: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: var(--z-tooltip);
        animation: slide-in-right 0.3s ease-out;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slide-in-right 0.3s ease-out reverse';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

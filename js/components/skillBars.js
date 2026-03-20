/**
 * Skill Bars Component - Animated progress bars
 */

class SkillBars {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.skills = [];
    }

    /**
     * Load skills data
     */
    async loadSkills() {
        try {
            const response = await fetch('data/content.json');
            const data = await response.json();
            this.skills = data.skills;
            this.render();
        } catch (error) {
            console.error('Error loading skills:', error);
        }
    }

    /**
     * Render skill cards
     */
    render() {
        if (!this.container) return;

        this.deviconMap = {
            'Java': 'java-original',
            'C++': 'cplusplus-original',
            'Python': 'python-original',
            'React': 'react-original',
            'Node.js': 'nodejs-original-wordmark',
            'MongoDB': 'mongodb-original',
            'AWS EC2': 'amazonwebservices-plain-wordmark',
            'AWS S3': 'amazonwebservices-plain-wordmark',
            'AWS Lambda': 'amazonwebservices-plain-wordmark',
            'Apache CloudStack': 'apache-original',
            'Linux (Ubuntu/Arch/Debian)': 'linux-original',
            'Git & GitHub': 'git-original'
        };

        this.container.innerHTML = this.skills.map((skill) => {
            const iconName = this.deviconMap[skill.name] || 'devicon-original';
            const folder = iconName.split('-')[0];
            const iconUrl = `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${folder}/${iconName}.svg`;
            
            const randomX = Math.floor(Math.random() * 80) + 10; // 10% to 90%
            const delay = Math.random() * 5; // 0 to 5s delay
            const duration = Math.random() * 4 + 6; // 6 to 10s duration
            const size = Math.random() * 20 + 60; // 60px to 80px

            return `
                <div class="skill-bubble" style="left: ${randomX}%; animation-delay: ${delay}s; animation-duration: ${duration}s; width: ${size}px; height: ${size}px;">
                    <img src="${iconUrl}" alt="${skill.name}" title="${skill.name}" />
                </div>
            `;
        }).join('');
    }

    /**
     * Setup interactive bubbles on click/tap
     */
    setupInteractivity() {
        // Expose instance for global access
        window.skillBarsInstance = this;

        // Global listener for spawning bubbles in any glass card
        document.addEventListener('click', (e) => {
            // Find the closest card-like element
            const card = e.target.closest('.project-card, .achievement-card, .timeline-item, .stat, .profile-card, #skillsGrid');
            
            if (card) {
                // Get click coordinates relative to that card
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Pick a random skill
                if (this.skills.length === 0) return;
                const skill = this.skills[Math.floor(Math.random() * this.skills.length)];
                
                this.createInteractiveBubble(x, y, skill, card);
            }
        });
    }

    /**
     * Create a single bubble at a specific location inside a target container
     */
    createInteractiveBubble(x, y, skill, targetContainer) {
        const iconName = this.deviconMap[skill.name] || 'devicon-original';
        const folder = iconName.split('-')[0];
        const iconUrl = `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${folder}/${iconName}.svg`;
        
        const size = Math.random() * 15 + 60; // Slightly smaller for smaller cards
        const duration = Math.random() * 2 + 4; // Faster for immediate feedback

        const bubble = document.createElement('div');
        bubble.className = 'skill-bubble interactive-bubble';
        
        // Position it relative to Click
        bubble.style.left = `${x - size/2}px`;
        bubble.style.top = `${y - size/2}px`;
        bubble.style.bottom = 'auto'; // Disable the bottom rule from base CSS
        
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = '0s'; // Start immediately

        bubble.innerHTML = `<img src="${iconUrl}" alt="${skill.name}" title="${skill.name}" />`;
        
        targetContainer.appendChild(bubble);

        // Remove from DOM when animation finishes
        setTimeout(() => {
            bubble.remove();
        }, duration * 1000);
    }

    /**
     * Initialize skill bars
     */
    init() {
        this.loadSkills();
        this.setupInteractivity();
    }
}

export default SkillBars;

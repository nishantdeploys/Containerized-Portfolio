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

        const deviconMap = {
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
            const iconName = deviconMap[skill.name] || 'devicon-original';
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

        // Removed intersection observer since bubbles use infinite CSS animation
    }

    /**
     * Skill bubbles are animated via infinite CSS animations 
     * so no observer is needed for progress bars.
     */
    observeSkills() {
        // Obsolete
    }

    /**
     * Initialize skill bars
     */
    init() {
        this.loadSkills();
    }
}

export default SkillBars;

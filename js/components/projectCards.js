/**
 * Project Cards Component - Filterable project gallery
 */

const CONTENT_URL = 'data/content.json?v=20260320_1';

class ProjectCards {
    constructor(containerId, filtersId) {
        this.container = document.getElementById(containerId);
        this.filtersContainer = document.getElementById(filtersId);
        this.projects = [];
        this.currentFilter = 'all';
    }

    /**
     * Load projects data
     */
    async loadProjects() {
        try {
            const response = await fetch(CONTENT_URL, { cache: 'no-store' });
            const data = await response.json();
            this.projects = data.projects;
            this.render();
            this.setupFilters();
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    /**
     * Render project cards
     */
    render() {
        if (!this.container) return;

        const filteredProjects = this.currentFilter === 'all' 
            ? this.projects 
            : this.projects.filter(project => 
                project.categories.includes(this.currentFilter)
            );

        this.container.innerHTML = filteredProjects.map(project => `
            <div class="project-card" data-categories="${project.categories.join(',')}">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-tech">
                    ${project.technologies.map(tech => `
                        <span class="tech-tag">${tech}</span>
                    `).join('')}
                </div>
                <div class="project-links">
                    ${project.github ? `
                        <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="project-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub
                        </a>
                    ` : ''}
                    ${project.live ? `
                        <a href="${project.live}" target="_blank" rel="noopener noreferrer" class="project-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Live Demo
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Add tilt effect
        this.addTiltEffect();
    }

    /**
     * Setup filter buttons
     */
    setupFilters() {
        if (!this.filtersContainer) return;

        const filterButtons = this.filtersContainer.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update current filter
                this.currentFilter = button.getAttribute('data-filter');

                // Re-render projects
                this.render();
            });
        });
    }

    /**
     * Add tilt effect to project cards
     */
    addTiltEffect() {
        const cards = this.container.querySelectorAll('.project-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    /**
     * Initialize project cards
     */
    init() {
        this.loadProjects();
    }
}

export default ProjectCards;

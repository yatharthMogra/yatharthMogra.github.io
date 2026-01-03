// Theme toggle functionality
function initThemeToggle() {
	const themeToggle = document.getElementById('theme-toggle');
	const themeIcon = document.getElementById('theme-icon');
	const html = document.documentElement;

	// Get saved theme or default to light
	const savedTheme = localStorage.getItem('theme') || 'light';
	html.setAttribute('data-theme', savedTheme);
	updateThemeIcon(savedTheme, themeIcon);

	// Toggle theme on button click
	themeToggle.addEventListener('click', () => {
		const currentTheme = html.getAttribute('data-theme');
		const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
		html.setAttribute('data-theme', newTheme);
		localStorage.setItem('theme', newTheme);
		updateThemeIcon(newTheme, themeIcon);
	});
}

function updateThemeIcon(theme, icon) {
	if (theme === 'dark') {
		icon.classList.remove('fa-moon');
		icon.classList.add('fa-sun');
	} else {
		icon.classList.remove('fa-sun');
		icon.classList.add('fa-moon');
	}
}

// Navigation: Show/hide sections on click
document.addEventListener('DOMContentLoaded', function () {
	// Initialize theme toggle
	initThemeToggle();

	const sections = document.querySelectorAll('section[id]');
	const navLinks = document.querySelectorAll('nav a[href^="#"]');

	// Function to show a specific section and hide others
	function showSection(sectionId) {
		sections.forEach(section => {
			section.classList.remove('active');
		});

		const targetSection = document.getElementById(sectionId);
		if (targetSection) {
			targetSection.classList.add('active');
			// Scroll to top of page when switching sections
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		}

		// Update active nav link
		navLinks.forEach(link => {
			link.classList.remove('active');
			const href = link.getAttribute('href');
			if (href === `#${sectionId}`) {
				link.classList.add('active');
			}
		});
	}

	// Handle navigation link clicks
	navLinks.forEach(link => {
		link.addEventListener('click', function (e) {
			const href = this.getAttribute('href');
			if (href === '#' || !href.startsWith('#')) return;

			e.preventDefault();
			const targetId = href.substring(1);
			showSection(targetId);
			// Update URL hash without triggering scroll
			history.pushState(null, '', `#${targetId}`);
		});
	});

	// Show section based on URL hash or default to "about"
	const defaultSection = window.location.hash ? window.location.hash.substring(1) : 'about';
	if (defaultSection && document.getElementById(defaultSection)) {
		showSection(defaultSection);
	} else {
		showSection('about');
		history.replaceState(null, '', '#about');
	}

	// Handle browser back/forward buttons
	window.addEventListener('hashchange', function () {
		const sectionId = window.location.hash ? window.location.hash.substring(1) : 'about';
		showSection(sectionId);
	});

	// Load and render all content from JSON
	loadContent();

	// CV sidebar navigation
	setupCVNavigation();
});

// Load all content from data.json
async function loadContent() {
	try {
		const response = await fetch('./data.json');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		// Render all sections
		renderAbout(data.about);
		renderProjects(data.projects);
		renderCV(data.cv);
		// Blog section shows "Coming soon" - loadBlogPosts(data.blog);
	} catch (error) {
		console.error('Error loading content:', error);
	}
}

// Render About section
function renderAbout(about) {
	// Profile image
	const profileImg = document.querySelector('.profile-image');
	if (profileImg && about.profileImage) {
		profileImg.src = about.profileImage;
		profileImg.alt = about.profileImageAlt || '';
	}

	// Name
	const nameEl = document.querySelector('.about-description h1');
	if (nameEl) {
		nameEl.textContent = about.name;
	}

	// Description paragraphs
	const descContainer = document.querySelector('.about-description');
	if (descContainer && about.description) {
		const existingParas = descContainer.querySelectorAll('p');
		existingParas.forEach(p => p.remove());

		about.description.forEach(para => {
			const p = document.createElement('p');
			p.innerHTML = renderMarkdown(para);
			descContainer.insertBefore(p, descContainer.querySelector('.social-links'));
		});
	}

	// Social links
	const socialContainer = document.querySelector('.social-links');
	if (socialContainer && about.socialLinks) {
		socialContainer.innerHTML = about.socialLinks.map(link => `
			<li><a href="${escapeHtml(link.url)}" aria-label="${escapeHtml(link.platform)}"><i class="${escapeHtml(link.icon)}"></i></a></li>
		`).join('');
	}

	// Updates
	const updatesContainer = document.querySelector('.updates-list');
	if (updatesContainer && about.updates) {
		updatesContainer.innerHTML = about.updates.map(update => `
			<li><span class="update-date">${escapeHtml(update.date)}</span> ${renderMarkdown(update.description)}</li>
		`).join('');
	}
}

// Render Projects section
function renderProjects(projects) {
	const container = document.querySelector('.projects-container');
	if (!container || !projects) return;

	container.innerHTML = '';

	// Sort years in reverse chronological order
	const years = Object.keys(projects).sort((a, b) => parseInt(b) - parseInt(a));

	years.forEach(year => {
		const yearGroup = document.createElement('div');
		yearGroup.className = 'project-year-group';

		const yearHeader = document.createElement('h3');
		yearHeader.className = 'year-header';
		yearHeader.textContent = year;
		yearGroup.appendChild(yearHeader);

		projects[year].forEach(project => {
			const projectCard = document.createElement('article');
			projectCard.className = 'project-card';

			const imageDiv = document.createElement('div');
			imageDiv.className = 'project-image';
			if (project.image) {
				const img = document.createElement('img');
				img.src = project.image;
				img.alt = project.imageAlt || '';
				img.className = 'project-screenshot';
				imageDiv.appendChild(img);
			}
			projectCard.appendChild(imageDiv);

			const contentDiv = document.createElement('div');
			contentDiv.className = 'project-content';

			const title = document.createElement('h4');
			title.textContent = project.name;
			contentDiv.appendChild(title);

			const desc = document.createElement('p');
			desc.innerHTML = renderMarkdown(project.description);
			contentDiv.appendChild(desc);

			const tech = document.createElement('p');
			tech.className = 'project-tech-stack';
			tech.innerHTML = `<strong>Tech stack:</strong> ${escapeHtml(project.techStack)}`;
			contentDiv.appendChild(tech);

			const linksDiv = document.createElement('div');
			linksDiv.className = 'project-links';
			if (project.links.code) {
				const codeLink = document.createElement('a');
				codeLink.href = project.links.code;
				codeLink.target = '_blank';
				codeLink.rel = 'noopener noreferrer';
				codeLink.textContent = 'Code';
				linksDiv.appendChild(codeLink);
			}
			if (project.links.blog) {
				const blogLink = document.createElement('a');
				blogLink.href = project.links.blog;
				blogLink.target = '_blank';
				blogLink.rel = 'noopener noreferrer';
				blogLink.textContent = 'Blog';
				linksDiv.appendChild(blogLink);
			}
			contentDiv.appendChild(linksDiv);

			projectCard.appendChild(contentDiv);
			yearGroup.appendChild(projectCard);
		});

		container.appendChild(yearGroup);
	});
}

// Render CV section
function renderCV(cv) {
	if (!cv) return;

	// Update resume URL
	const resumeLink = document.querySelector('.cv-download-icon');
	if (resumeLink && cv.resumeUrl) {
		resumeLink.href = cv.resumeUrl;
	}

	// Render CV sidebar navigation
	const cvSidebar = document.querySelector('.cv-sidebar ul');
	if (cvSidebar && cv.sections) {
		cvSidebar.innerHTML = cv.sections.map(section => `
			<li><a href="#${escapeHtml(section.id)}" class="cv-nav-link">${escapeHtml(section.title)}</a></li>
		`).join('');
	}

	// Render CV sections
	const cvContent = document.querySelector('.cv-content');
	if (!cvContent || !cv.sections) return;

	cvContent.innerHTML = cv.sections.map(section => {
		let contentHtml = '';
		if (section.type === 'list') {
			contentHtml = `<ul>${section.content.map(item => `<li>${renderMarkdown(item)}</li>`).join('')}</ul>`;
		} else if (section.type === 'categorized-list') {
			contentHtml = section.content.map((category, index) => {
				const itemsHtml = category.items.map(item => `<li>${renderMarkdown(item)}</li>`).join('');
				const separator = index < section.content.length - 1 ? '<hr class="category-separator">' : '';
				return `
					<div class="interest-category">
						<div class="interest-category-title">${renderMarkdown(category.category)}</div>
						<ul class="interest-items">${itemsHtml}</ul>
					</div>
					${separator}
				`;
			}).join('');
		} else if (section.type === 'education') {
			contentHtml = section.content.map(entry => {
				const descriptionHtml = entry.description ? `<p class="education-description">${renderMarkdown(entry.description)}</p>` : '';
				const detailsHtml = entry.details && entry.details.length > 0 ? `<ul class="education-details">${entry.details.map(detail => `<li>${renderMarkdown(detail)}</li>`).join('')}</ul>` : '';
				const contentHtml = descriptionHtml || detailsHtml;
				return `
					<div class="education-entry">
						<div class="education-date-badge">${escapeHtml(entry.date)}</div>
						<div class="education-content">
							<div class="education-degree">${renderMarkdown(entry.degree)}</div>
							<div class="education-institution">
								<i class="fas fa-university"></i>
								<span>${escapeHtml(entry.institution)}, ${escapeHtml(entry.location)}</span>
							</div>
							${contentHtml}
						</div>
					</div>
				`;
			}).join('');
		} else if (section.type === 'experience') {
			contentHtml = section.content.map(entry => {
				const descriptionHtml = entry.description ? `<p class="education-description">${renderMarkdown(entry.description)}</p>` : '';
				const detailsHtml = entry.details && entry.details.length > 0 ? `<ul class="education-details">${entry.details.map(detail => `<li>${renderMarkdown(detail)}</li>`).join('')}</ul>` : '';
				const contentHtml = descriptionHtml || detailsHtml;
				let iconClass = 'fas fa-briefcase';
				if (section.id === 'cv-research') {
					iconClass = 'fas fa-flask';
				} else if (section.id === 'cv-honors') {
					iconClass = 'fas fa-trophy';
				}
				return `
					<div class="education-entry">
						<div class="education-date-badge">${escapeHtml(entry.date)}</div>
						<div class="education-content">
							<div class="education-degree">${renderMarkdown(entry.title)}</div>
							<div class="education-institution">
								<i class="${iconClass}"></i>
								<span>${escapeHtml(entry.company)}, ${escapeHtml(entry.location)}</span>
							</div>
							${contentHtml}
						</div>
					</div>
				`;
			}).join('');
		} else {
			contentHtml = section.content.map(item => `<p>${renderMarkdown(item)}</p>`).join('');
		}

		return `
			<div id="${escapeHtml(section.id)}" class="cv-card">
				<h3>${escapeHtml(section.title)}</h3>
				${contentHtml}
			</div>
		`;
	}).join('');

	// Re-setup CV navigation after rendering
	setTimeout(() => setupCVNavigation(), 100);
}

// CV sidebar navigation functionality
function setupCVNavigation() {
	const cvNavLinks = document.querySelectorAll('.cv-nav-link');
	const cvSections = document.querySelectorAll('.cv-card[id]');

	if (cvNavLinks.length === 0 || cvSections.length === 0) {
		return;
	}

	// Smooth scrolling for CV nav links (within CV section)
	cvNavLinks.forEach(link => {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			const href = this.getAttribute('href');
			const targetId = href.substring(1);
			const targetSection = document.getElementById(targetId);

			if (targetSection) {
				// Find the CV section container
				const cvSection = document.getElementById('cv');
				if (!cvSection) return;

				// Calculate position relative to CV section
				const cvSectionTop = cvSection.getBoundingClientRect().top + window.pageYOffset;
				const targetSectionTop = targetSection.getBoundingClientRect().top + window.pageYOffset;
				const headerOffset = 100;
				const offsetPosition = cvSectionTop + (targetSectionTop - cvSectionTop) - headerOffset;

				window.scrollTo({
					top: offsetPosition,
					behavior: 'smooth'
				});

				// Update active state
				cvNavLinks.forEach(nav => nav.classList.remove('active'));
				this.classList.add('active');
			}
		});
	});

	// Update active CV nav link on scroll (only when CV section is visible)
	function updateActiveCVNav() {
		const cvSection = document.getElementById('cv');
		if (!cvSection || !cvSection.classList.contains('active')) {
			return;
		}

		let current = '';

		cvSections.forEach(section => {
			const sectionTop = section.getBoundingClientRect().top;
			const sectionHeight = section.offsetHeight;

			if (sectionTop <= 150 && sectionTop + sectionHeight > 150) {
				current = section.getAttribute('id');
			}
		});

		cvNavLinks.forEach(link => {
			link.classList.remove('active');
			const href = link.getAttribute('href');
			if (href === `#${current}`) {
				link.classList.add('active');
			}
		});
	}

	window.addEventListener('scroll', updateActiveCVNav);
	updateActiveCVNav();
}

// Blog post rendering from JSON
async function loadBlogPosts(blogData) {
	const blogContainer = document.getElementById('blog-posts');

	if (!blogContainer) {
		return;
	}

	// Show loading state
	blogContainer.innerHTML = '<div class="blog-loading">Loading blog posts...</div>';

	// Update blog description if provided
	if (blogData && blogData.description) {
		const blogDesc = document.querySelector('#blog p');
		if (blogDesc) {
			blogDesc.textContent = blogData.description;
		}
	}

	try {
		const response = await fetch('./blog.json');

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const posts = await response.json();

		if (!Array.isArray(posts) || posts.length === 0) {
			blogContainer.innerHTML = '<div class="blog-loading">No blog posts available.</div>';
			return;
		}

		// Render blog posts
		blogContainer.innerHTML = posts.map(post => {
			const date = new Date(post.date);
			const formattedDate = date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});

			const hasCoverImage = post.coverImage && post.coverImage.trim() !== '';
			const coverImageHtml = hasCoverImage ?
				`<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" class="blog-post-cover">` : '';

			return `
				<article class="blog-post ${hasCoverImage ? 'has-cover' : 'no-cover'}">
					${coverImageHtml}
					<div class="blog-post-content">
						<h3><a href="#blog" data-slug="${post.slug}">${escapeHtml(post.title)}</a></h3>
						<div class="blog-post-meta">
							<span>${formattedDate}</span>
							${post.readTime ? `<span>${escapeHtml(post.readTime)}</span>` : ''}
						</div>
						<div class="blog-post-excerpt">
							<p>${escapeHtml(post.excerpt)}</p>
						</div>
					</div>
				</article>
			`;
		}).join('');

	} catch (error) {
		console.error('Error loading blog posts:', error);
		blogContainer.innerHTML = `
			<div class="blog-error">
				<p>Failed to load blog posts. Please try again later.</p>
			</div>
		`;
	}
}

// Utility function to escape HTML (prevent XSS)
function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// Markdown rendering helper
function renderMarkdown(markdown) {
	if (typeof marked !== 'undefined') {
		return marked.parse(markdown);
	}
	// Fallback if marked is not loaded
	return escapeHtml(markdown);
}



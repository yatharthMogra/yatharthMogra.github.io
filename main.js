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

	// Load and render blog posts
	loadBlogPosts();

	// CV sidebar navigation
	setupCVNavigation();
});

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
async function loadBlogPosts() {
	const blogContainer = document.getElementById('blog-posts');

	if (!blogContainer) {
		return;
	}

	// Show loading state
	blogContainer.innerHTML = '<div class="blog-loading">Loading blog posts...</div>';

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



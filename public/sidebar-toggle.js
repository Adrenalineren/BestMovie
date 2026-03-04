// Hamburger menu toggle
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('close-btn');

// Open sidebar when hamburger is clicked
hamburgerBtn.addEventListener('click', () => {
  hamburgerBtn.classList.toggle('active');
  sidebar.classList.toggle('open');
});

// Close sidebar when close button is clicked
closeBtn.addEventListener('click', () => {
  hamburgerBtn.classList.remove('active');
  sidebar.classList.remove('open');
});

// Close sidebar when a link is clicked
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburgerBtn.classList.remove('active');
    sidebar.classList.remove('open');
  });
});

// Close sidebar when clicking outside of it
document.addEventListener('click', (event) => {
  const isClickInsideSidebar = sidebar.contains(event.target);
  const isClickOnHamburger = hamburgerBtn.contains(event.target);
  
  if (!isClickInsideSidebar && !isClickOnHamburger && sidebar.classList.contains('open')) {
    hamburgerBtn.classList.remove('active');
    sidebar.classList.remove('open');
  }
});

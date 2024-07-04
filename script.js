// script.js
document.addEventListener('DOMContentLoaded', () => {
  initializeUserState();
  attachPopupEventListeners();
  adjustPopupPosition();
  attachFormSubmissionListener();
  attachSocialLoginListeners();
  attachJobSearchListener();
  displayJobApplications();
  updateDateTime();
});

window.addEventListener('resize', adjustPopupPosition);

function adjustPopupPosition() {
  const navbar = document.querySelector('header');
  const navbarHeight = navbar.offsetHeight;
  document.querySelectorAll('.popup').forEach(popup => {
    popup.style.top = `${navbarHeight}px`;
  });
}

function attachPopupEventListeners() {
  document.getElementById('signupBtn')?.addEventListener('click', () => openPopup('signupPopup'));
  document.getElementById('loginBtn')?.addEventListener('click', () => openPopup('loginPopup'));
  document.querySelectorAll('.close').forEach(button => {
    button.addEventListener('click', () => closePopup(button.closest('.popup').id));
  });

  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('switchToLogin')?.addEventListener('click', switchPopup);
  document.getElementById('switchToSignup')?.addEventListener('click', switchPopup);
}

function openPopup(popupId) {
  const popup = document.getElementById(popupId);
  if (popup) {
    popup.classList.remove('hidden');
    popup.classList.add('flex');
    setTimeout(adjustPopupPosition, 10);
  }
}

function closePopup(popupId) {
  const popup = document.getElementById(popupId);
  if (popup) {
    popup.classList.remove('flex');
    popup.classList.add('hidden');
  }
}

function initializeUserState() {
  const userEmailSpan = document.getElementById('userEmail');
  const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
  if (userEmailSpan) {
    userEmailSpan.textContent = loggedInUserEmail || '';
  }
  document.getElementById('userPanel').classList.toggle('hidden', !loggedInUserEmail);
  document.getElementById('authButtons').classList.toggle('hidden', !!loggedInUserEmail);
}

function logout() {
  localStorage.removeItem('loggedInUserEmail');
  window.location.reload();
}

function login(email) {
  localStorage.setItem('loggedInUserEmail', email);
  window.location.reload();
}

function switchPopup() {
  const loginPopup = document.getElementById('loginPopup');
  const signupPopup = document.getElementById('signupPopup');
  loginPopup.classList.toggle('hidden');
  loginPopup.classList.toggle('flex');
  signupPopup.classList.toggle('hidden');
  signupPopup.classList.toggle('flex');
  setTimeout(adjustPopupPosition, 10);
}

function attachFormSubmissionListener() {
  const form = document.getElementById('jobApplicationForm');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      const applicationData = Object.fromEntries(formData.entries());
      
      let jobApplications = JSON.parse(localStorage.getItem('jobApplications')) || [];
      jobApplications.push(applicationData);
      localStorage.setItem('jobApplications', JSON.stringify(jobApplications));
      
      displayJobApplications();
      form.reset();
    });
  }
}

function displayJobApplications() {
  const jobApplicationTable = document.getElementById('jobApplicationTable');
  if (!jobApplicationTable) return;

  let jobApplications = JSON.parse(localStorage.getItem('jobApplications')) || [];
  jobApplicationTable.innerHTML = '';

  jobApplications.forEach((application, index) => {
    const row = document.createElement('tr');
    Object.keys(application).forEach((key) => {
      const cell = document.createElement('td');
      cell.setAttribute('data-label', key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'));
      cell.textContent = application[key];
      row.appendChild(cell);
    });

    const deleteCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = function () {
      jobApplications.splice(index, 1);
      localStorage.setItem('jobApplications', JSON.stringify(jobApplications));
      displayJobApplications();
    };
    deleteCell.appendChild(deleteButton);
    row.appendChild(deleteCell);

    jobApplicationTable.appendChild(row);
  });
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  
  if (mobileMenu.classList.contains('hidden')) {
    mobileMenu.classList.remove('hidden');
    menuIcon.classList.remove('fa-bars');
    menuIcon.classList.add('fa-times');
  } else {
    mobileMenu.classList.add('hidden');
    menuIcon.classList.remove('fa-times');
    menuIcon.classList.add('fa-bars');
  }
}

function attachSocialLoginListeners() {
  document.getElementById('googleSignup')?.addEventListener('click', () => handleSocialLogin('google', 'signup'));
  document.getElementById('linkedinSignup')?.addEventListener('click', () => handleSocialLogin('linkedin', 'signup'));
  document.getElementById('googleLogin')?.addEventListener('click', () => handleSocialLogin('google', 'login'));
  document.getElementById('linkedinLogin')?.addEventListener('click', () => handleSocialLogin('linkedin', 'login'));
}

function handleSocialLogin(provider, action) {
  console.log(`Attempting to ${action} with ${provider}`);
  if (action === 'login') {
    simulateSocialLogin(provider);
  } else {
    simulateSocialSignup(provider);
  }
}

function simulateSocialLogin(provider) {
  const email = `user@${provider}.com`;
  login(email);
}

function simulateSocialSignup(provider) {
  const email = `newuser@${provider}.com`;
  login(email);
}

function attachJobSearchListener() {
  const searchForm = document.querySelector('form');
  if (searchForm) {
    searchForm.addEventListener('submit', handleJobSearch);
  }
}

async function handleJobSearch(event) {
  event.preventDefault();
  
  const jobInput = document.getElementById('job').value;
  const locationInput = document.getElementById('location').value;

  try {
    const results = await searchJobs(jobInput, locationInput);
    displayJobResults(results);
  } catch (error) {
    console.error('Error searching jobs:', error);
    alert('An error occurred while searching for jobs. Please try again.');
  }
}

async function getAccessToken(clientId, clientSecret) {
  const tokenUrl = 'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token';
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'api_offresdemploiv2 o2dsoffre');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params
  });

  if (!response.ok) {
    throw new Error('Failed to obtain access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function searchJobs(job, location) {
  const clientId = 'YOUR_CLIENT_ID';
  const clientSecret = 'YOUR_CLIENT_SECRET';
  
  try {
    const accessToken = await getAccessToken(clientId, clientSecret);
    
    const apiUrl = `https://api.emploi-store.fr/partenaire/offresdemploi/v2/offres/search?motsCles=${encodeURIComponent(job)}&commune=${encodeURIComponent(location)}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch jobs from France Travail API');
    }

    return response.json();
  } catch (error) {
    console.error('Error in searchJobs:', error);
    throw error;
  }
}

function displayJobResults(results) {
  const resultsContainer = document.getElementById('jobResults') || createJobResultsContainer();
  resultsContainer.innerHTML = '';

  if (results.resultats && results.resultats.length > 0) {
    results.resultats.forEach(job => {
      const jobElement = document.createElement('div');
      jobElement.className = 'job-item bg-white p-4 mb-4 rounded shadow';
      jobElement.innerHTML = `
        <h3 class="text-lg font-bold">${job.intitule}</h3>
        <p class="text-sm text-gray-600">${job.entreprise.nom}</p>
        <p>${job.lieuTravail.libelle}</p>
        <p class="mt-2">${job.description.slice(0, 150)}...</p>
        <a href="${job.origineOffre.urlOrigine}" target="_blank" class="text-blue-500 hover:underline mt-2 inline-block">View Details</a>
      `;
      resultsContainer.appendChild(jobElement);
    });
  } else {
    resultsContainer.innerHTML = '<p class="text-center">No jobs found. Please try a different search.</p>';
  }
}

function createJobResultsContainer() {
  const container = document.createElement('div');
  container.id = 'jobResults';
  container.className = 'mt-8';
  document.querySelector('.bg-teal-300').after(container);
  return container;
}

function updateDateTime() {
  const currentDate = new Date();
  const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
  
  const timeElement = document.createElement('div');
  timeElement.textContent = currentDate.toLocaleString('en-US', optionsTime);
  
  const dateElement = document.createElement('div');
  dateElement.textContent = currentDate.toLocaleString('en-US', optionsDate);
  
  const dateTimeContainer = document.getElementById('currentDateTime');
  if (dateTimeContainer) {
    dateTimeContainer.innerHTML = '';
    dateTimeContainer.appendChild(timeElement);
    dateTimeContainer.appendChild(dateElement);
  }
}

setInterval(updateDateTime, 1000);
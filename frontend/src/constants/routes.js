export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  APPLICANT: '/applicant',
  APPLY: '/applicant/apply',
  OFFICER: '/officer',
  OFFICER_APPLICATIONS: '/officer/applications',
  officerApplication: (id) => `/officer/applications/${id}`,
};

export const EXTERNAL_LINKS = {
  PLATFORM: '#platform',
  HOW_IT_WORKS: '#how-it-works',
  SECURITY: '#security',
};

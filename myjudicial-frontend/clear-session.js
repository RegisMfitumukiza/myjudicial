// Complete session clearing script
// Run this in browser console to force clear all session data

console.log("🔄 Clearing all MyJudicial session data...");

// Clear NextAuth session cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Clear NextAuth specific cookies
const nextAuthCookies = [
  'next-auth.session-token',
  'next-auth.csrf-token',
  'next-auth.callback-url',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.csrf-token',
  'next-auth.pkce.code_verifier'
];

nextAuthCookies.forEach(cookieName => {
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`;
});

// Clear localStorage
localStorage.clear();

// Clear sessionStorage  
sessionStorage.clear();

// Clear IndexedDB (if any)
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    });
  });
}

console.log("✅ All session data cleared!");
console.log("📝 Now close ALL browser tabs and go to: http://localhost:3000/sign-in");
console.log("🎯 Login ONLY as expert user and test onboarding.");

// Redirect to sign-in after clearing
setTimeout(() => {
  window.location.href = '/sign-in';
}, 1000);
const shouldUseSecureCookie = () => window.location.protocol === 'https:';

export const setCookie = (name, value, maxAgeSeconds = 86400) => {
  const secure = shouldUseSecureCookie() ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Strict${secure}`;
};

export const getCookie = (name) => {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i += 1) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(cookieName)) {
      return decodeURIComponent(cookie.substring(cookieName.length));
    }
  }

  return '';
};

export const removeCookie = (name) => {
  const secure = shouldUseSecureCookie() ? '; Secure' : '';
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict${secure}`;
};

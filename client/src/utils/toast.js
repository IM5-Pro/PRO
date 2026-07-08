const TOAST_CONTAINER_ID = 'app-toast-container';

const getToastContainer = () => {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (container) {
    return container;
  }

  container = document.createElement('div');
  container.id = TOAST_CONTAINER_ID;
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
};

export const showToast = (message, type = 'success', duration = 2500) => {
  if (!message) {
    return;
  }

  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 200);
  }, duration);
};

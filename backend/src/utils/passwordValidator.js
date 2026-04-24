const validatePassword = (password, username = '') => {
  const errors = [];
  let score = 0;

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push('Password must not contain your username');
  }

  const strengthMap = { 0: 'very_weak', 1: 'weak', 2: 'weak', 3: 'fair', 4: 'strong', 5: 'very_strong' };

  return {
    isValid: errors.length === 0,
    errors,
    strength: strengthMap[score] || 'very_weak',
    score,
  };
};

module.exports = { validatePassword };

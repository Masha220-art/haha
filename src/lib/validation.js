

function isLatinOrDigit(ch) {
  const code = ch.charCodeAt(0);
  const isDigit = code >= 48 && code <= 57;       // 0-9
  const isUpper = code >= 65 && code <= 90;         // A-Z
  const isLower = code >= 97 && code <= 122;        // a-z
  return isDigit || isUpper || isLower;
}

function isCyrillicOrSpace(ch) {
  if (ch === ' ') return true;
  const code = ch.charCodeAt(0);
  // А-Я, а-я, Ё, ё
  return (
    (code >= 1040 && code <= 1103) ||
    code === 1025 ||
    code === 1105
  );
}

function onlyLatinDigits(str) {
  for (let i = 0; i < str.length; i++) {
    if (!isLatinOrDigit(str[i])) return false;
  }
  return true;
}

function onlyCyrillicSpaces(str) {
  for (let i = 0; i < str.length; i++) {
    if (!isCyrillicOrSpace(str[i])) return false;
  }
  return true;
}

function isValidPhone(str) {
  // Ожидаем ровно: 8(912)345-67-89 — 16 символов
  if (str.length !== 16) return false;
  if (str[0] !== '8') return false;
  if (str[1] !== '(') return false;
  if (str[5] !== ')') return false;
  if (str[9] !== '-') return false;
  if (str[12] !== '-') return false;

  const digits = [0, 2, 3, 4, 6, 7, 8, 10, 11, 13, 14, 15];
  for (const i of digits) {
    if (str[i] < '0' || str[i] > '9') return false;
  }
  return true;
}

function isValidEmail(str) {
  const at = str.indexOf('@');
  if (at <= 0) return false;
  const afterAt = str.slice(at + 1);
  const dot = afterAt.indexOf('.');
  if (dot <= 0) return false;
  if (str.includes(' ')) return false;
  return true;
}

function parseDateParts(str) {
  const parts = str.split('.');
  if (parts.length !== 3) return null;
  if (parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;

  return { day, month, year };
}

function validateLogin(login) {
  const v = (login || '').trim();
  if (!v) return 'Введите логин.';
  if (v.length < 6) return 'Логин: не менее 6 символов.';
  if (!onlyLatinDigits(v)) return 'Логин: только латиница и цифры.';
  return null;
}

function validatePassword(password) {
  const v = password || '';
  if (!v) return 'Введите пароль.';
  if (v.length < 8) return 'Пароль: не менее 8 символов.';
  return null;
}

function validateFullName(fullName) {
  const v = (fullName || '').trim();
  if (!v) return 'Введите ФИО.';
  if (!onlyCyrillicSpaces(v)) return 'ФИО: только кириллица и пробелы.';
  return null;
}

function validatePhone(phone) {
  const v = (phone || '').trim();
  if (!v) return 'Введите телефон.';
  if (!isValidPhone(v)) return 'Телефон: формат 8(XXX)XXX-XX-XX.';
  return null;
}

function validateEmail(email) {
  const v = (email || '').trim().toLowerCase();
  if (!v) return 'Введите email.';
  if (!isValidEmail(v)) return 'Некорректный email.';
  return null;
}

function validateRegister(body) {
  const fieldErrors = {};
  const loginErr = validateLogin(body.login);
  const passwordErr = validatePassword(body.password);
  const fullNameErr = validateFullName(body.full_name);
  const phoneErr = validatePhone(body.phone);
  const emailErr = validateEmail(body.email);

  if (loginErr) fieldErrors.login = loginErr;
  if (passwordErr) fieldErrors.password = passwordErr;
  if (fullNameErr) fieldErrors.full_name = fullNameErr;
  if (phoneErr) fieldErrors.phone = phoneErr;
  if (emailErr) fieldErrors.email = emailErr;

  return {
    fieldErrors,
    valid: Object.keys(fieldErrors).length === 0,
    values: {
      login: (body.login || '').trim(),
      full_name: (body.full_name || '').trim(),
      phone: (body.phone || '').trim(),
      email: (body.email || '').trim().toLowerCase(),
    },
  };
}

function validateLoginForm(body) {
  const fieldErrors = {};
  const login = (body.login || '').trim();
  const password = body.password || '';

  if (!login) fieldErrors.login = 'Введите логин.';
  if (!password) fieldErrors.password = 'Введите пароль.';

  return {
    fieldErrors,
    valid: Object.keys(fieldErrors).length === 0,
    values: { login },
  };
}

function parseStartDate(str) {
  const v = (str || '').trim();
  if (!v) return { error: 'Укажите дату начала обучения.' };

  const parts = parseDateParts(v);
  if (!parts) return { error: 'Дата: формат ДД.ММ.ГГГГ.' };

  const { day, month, year } = parts;
  const d = new Date(year, month - 1, day);

  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return { error: 'Некорректная дата.' };
  }

  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { iso, display: v };
}

function validateApplication(body) {
  const fieldErrors = {};
  const courseId = (body.course_id || '').trim();

  if (!courseId) fieldErrors.course_id = 'Выберите курс.';

  const dateResult = parseStartDate(body.start_date);
  if (dateResult.error) fieldErrors.start_date = dateResult.error;

  const payment = (body.payment_method || '').trim();
  if (!payment) {
    fieldErrors.payment_method = 'Выберите способ оплаты.';
  } else if (!['cash', 'phone_transfer'].includes(payment)) {
    fieldErrors.payment_method = 'Недопустимый способ оплаты.';
  }

  return {
    fieldErrors,
    valid: Object.keys(fieldErrors).length === 0,
    values: {
      course_id: courseId,
      start_date: (body.start_date || '').trim(),
      payment_method: payment,
      startDateIso: dateResult.iso,
    },
  };
}

module.exports = {
  validateRegister,
  validateLoginForm,
  validateApplication,
  parseStartDate,
};

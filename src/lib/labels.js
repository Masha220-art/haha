const APPLICATION_STATUS = {
  new: 'Новая',
  in_progress: 'Идёт обучение',
  completed: 'Обучение завершено',
};

const PAYMENT_METHOD = {
  cash: 'Наличными',
  phone_transfer: 'Перевод по номеру телефона',
};

const REVIEW_STATUS = {
  pending: 'На модерации',
  published: 'Опубликован',
  rejected: 'Отклонён',
};

function formatDateRu(isoOrDate) {
  if (!isoOrDate) return '—';
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

module.exports = {
  APPLICATION_STATUS,
  PAYMENT_METHOD,
  REVIEW_STATUS,
  formatDateRu,
};

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    if (req.accepts('html')) {
      return res.redirect('/auth/login?next=' + encodeURIComponent(req.originalUrl));
    }
    return res.status(401).send('401');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login?next=' + encodeURIComponent(req.originalUrl));
  }
  if (req.session.role !== 'admin') {
    return res.status(403).render('error', {
      title: '403',
      message: 'Нужна роль admin.',
    });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };

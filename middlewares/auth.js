function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.sendStatus(401);
  }
  next();
}

module.exports = requireAuth;
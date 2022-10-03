module.exports = async (req, res, next) => {
	if (!req.user.email.confirmed) {
		res.status(403).send({
			success: false,
			code: 'verify_email',
		});
	} else {
		next();
	}
};
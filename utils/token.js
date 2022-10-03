require('dotenv').config();
const {
	db
} = require('./firebase');

module.exports = async (req, res, next) => {
	const token = req.header('CHATEX-TOKEN');
	if (!token) {
		res.status(403).send({
			success: false,
			code: 'token_missing'
		});
	} else {
		const user = await db.users.where('security.token', '==', token).get();

		if (user.empty) {
			res.status(403).send({
				success: false,
				code: 'wrong_token'
			});
		} else {
			req.user = {
				...user.docs[0].data()
			};
			next();
		}
	}
};
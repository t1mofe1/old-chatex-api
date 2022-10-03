const db = require('../utils/firebase');
const checkToken = require('../utils/token');
const app = require('express').Router();

app.get('/', checkToken.required, async (req, res) => {
	if (!req.user) {
		res.status(403).send({ success: false, code: 'wrong_code' });
	} else {
		res.status(200).send({ success: true, user: req.user });
	}
});

app.get('/:username', async (req, res) => {
	let user = await db.users.doc(req.params['username']).get();
	if (user.exists) {
		user = user.data();
		delete user.password;
		delete user.token;
		res.status(200).send({ success: true, user });
	} else {
		res.status(404).send({ success: false, code: 'not_found' });
	}
});

app.patch('/', async (req, res) => {
	let field = req.body.field;
	let data = req.body.data;

	db.users.where('token', '==', req.token).set({
		[field]: data,
	});
});

module.exports = app;

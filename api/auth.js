require('dotenv').config();
const { hash: bcrypt_hash, compare: bcrypt_compare } = require('bcrypt');
const { db } = require('../utils/firebase');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const validator = require('../utils/validator');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	host: 'smtp.gmail.com',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

const app = require('express').Router();

app.get(
	'/verify/:uid/:email/:hash',
	validator.validate([
		validator.param('uid').trim().notEmpty({ errorMessage: 'uid_missing' }),
		validator.param('email').trim().notEmpty({ errorMessage: 'email_missing' }).isEmail({ errorMessage: 'wrong email' }),
		validator.param('hash').trim().notEmpty({ errorMessage: 'hash_missing' }),
	]),
	async (req, res) => {
		await db.users
			.where('email', '==', req.params.email)
			.get()
			.then(async (result) => {
				if (result.empty) {
					res.status(403).send({
						success: false,
						code: 'wrong_credentials',
					});
				} else {
					await result.docs[0].get().then(async (user) => {
						let data = user.data();
						if (data.email.verify_hash === req.params.hash) {
							user.set(
								{
									email: {
										verified: true,
										verify_hash: db.fieldValue.delete(),
									},
								},
								{ merge: true },
							);
							res.status(200).send({
								success: true,
							});
						} else {
							res.status(403).send({
								success: false,
								code: 'wrong_credentials',
							});
						}
					});
				}
			});
	},
);

app.post(
	'/register',
	validator.validate([
		validator.body('username').trim().notEmpty({ errorMessage: 'username missing' }),
		validator.body('email').trim().isEmail({ errorMessage: 'wrong email' }).notEmpty({ errorMessage: 'email missing' }),
		validator.body('password').trim().notEmpty({ errorMessage: 'password missing' }),
		validator.body('language').trim().notEmpty({ errorMessage: 'language missing' }).isLength({ min: 2, max: 5 }),
	]),
	async (req, res) => {
		if (
			!(await db.users
				.where('username', '==', req.body.username)
				.get()
				.then(async (res) => res.empty))
		) {
			res.status(400).send({ success: false, code: 'username_duplicate' });
		} else if (
			!(await db.users
				.where('email.address', '==', req.body.email)
				.get()
				.then(async (res) => res.empty))
		) {
			res.status(400).send({ success: false, code: 'email_duplicate' });
		} else {
			bcrypt_hash(req.body.password, 10, async (err, hash) => {
				if (err) res.code(500).send({ success: false, code: 'server_error' });
				const token = uuidv4();
				const user = {
					username: req.body.username,
					email: {
						address: req.body.email,
						verified: false,
						verify_hash: crypto.randomBytes(24).toString('hex'),
					},
					avatar: null,
					security: {
						token,
						password: hash,
					},
					creation_time: new Date.toISOString(),
					privileges: {
						admin: false,
						premium: false,
					},
				};
				await db.users.doc(req.body.username).set(user);
				delete user.security;
				transporter.sendMail(
					{
						from: `"Chatex" ${process.env.EMAIL_USER}`,
						to: user.email,
						subject: 'Подтверждение электронной почты',
						html: `
					<h2>Уважаемый ${user.username},</h2>
					<p>Пожалуйста перейдите по ссылке ниже чтобы активировать ваш аккаунт.</p><a href="http://192.168.1.6/auth/verify/${user.email}/${user.email_verify_hash}">Клик</a>
					<br><br>
					<h4>Всего наилучшего,</h4><h3>Chatex</h3>`,
					},
					(err) => {
						if (err) console.log(err);
					},
				);
				res.status(200).send({ success: true, code: 'register_success', user });
			});
		}
	},
);

app.post(
	'/login',
	validator.validate([validator.body('login').trim().notEmpty({ errorMessage: 'login missing' }), validator.body('password').trim().notEmpty({ errorMessage: 'password missing' })]),
	async (req, res) => {
		const email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g;
		const query = await db.users.where(email_regex.test(req.body.login) ? 'email' : 'username', '==', req.body.login).get();
		if (query.empty) {
			res.status(403).send({ success: false, message: 'wrong_credentials' });
		} else {
			const user = await query.docs[0].ref.get().then(async (res) => res.data());
			bcrypt_compare(req.body.password, user.security.password, (err, result) => {
				if (err) res.status(500).send({ success: false, code: 'server_error' });
				else if (!result) res.status(403).send({ success: false, code: 'wrong_credentials' });
				else {
					const { token } = user.security;
					delete user.security;
					res.status(200).send({ success: true, code: 'auth_success', user, token });
				}
			});
		}
	},
);

module.exports = app;

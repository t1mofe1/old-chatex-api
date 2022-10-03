const express = require('express');
const app = express();

app.use(require('compression')());
app.use(require('cors')());
app.use(require('helmet')());
app.use(express.json());
app.set('json spaces', 2);

require('fs')
	.readdirSync('./api')
	.filter((file) => file.endsWith('.js'))
	.forEach((route) => {
		app.use(`/${route.substring(0, route.length - 3)}`, require(`./api/${route}`));
	});

app.all('/', (req, res) => {
	res.send('WELCOME TO CHATEX API');
});

app.use((req, res, next) => {
	res.status(404).send({
		success: false,
		code: 'not_found',
	});
});

app.use((err, req, res, next) => {
	console.log(err);
	res.status(500).send({
		success: false,
		code: 'server_error',
	});
});

const connectionOptions = {
	ip:
		process.env.NODE_ENV === 'production'
			? '127.0.0.1'
			: Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat((i.family === 'IPv4' && !i.internal && i.address) || []), [])), [])[0],
	port: process.env.PORT || 80,
};
app.listen(connectionOptions.port, connectionOptions.ip, () => {
	console.log(
		`Server started at http${process.env.NODE_ENV === 'production' ? 's' : ''}://${connectionOptions.ip}${
			connectionOptions.port !== 80 || connectionOptions.port !== 443 ? ':' + connectionOptions.port : ''
		}`,
	);
});

// const { db } = require('./firebase');

// class Message {
// 	constructor(content, author) {
// 		this.data = {};
// 		this.data.content = content;
// 		this.data.author = new Author(author);

// 		this.save = () => {
// 			db.messages.add(this.data);
// 		};

// 		this.delete = (full = false) => {
// 			if (full) {
// 			}
// 			db.messages.delete();
// 		};
// 	}
// }

// class Author extends Message {
// 	constructor(user) {
// 		if (user instanceof User) {
// 			this.email = user.email.address;
// 		}
// 		this.username = user.username;
// 		this.email = user.email;
// 		this.author = user;
// 	}
// }

// class User {
// 	constructor(username, email, password, language = 'en') {}
// }

// const message = new Message('hello world', {
// 	username: 'admin',
// 	password: 'asdasdlasld',
// });

// console.log(message);

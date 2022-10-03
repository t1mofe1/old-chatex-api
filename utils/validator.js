const validator = require('express-validator');

validator.validate = (validations) => {
	return async (req, res, next) => {
		for (let validation of validations) {
			const result = await validation.run(req);
			if (result.errors.length) break;
		}

		const errors = validator.validationResult(req);

		if (errors.isEmpty()) {
			return next();
		} else {
			return res.status(400).json({ success: false, code: errors.array({ onlyFirstError: true })[0].msg });
		}
	};
};

module.exports = validator;

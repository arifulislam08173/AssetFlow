"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const errors_1 = require("../utils/errors");
function validate(schema, source = "body") {
    return (req, _res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            return next(new errors_1.ApiError(400, result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")));
        }
        req[source] = result.data;
        next();
    };
}

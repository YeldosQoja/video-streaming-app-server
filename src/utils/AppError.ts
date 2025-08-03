import { HttpStatusCode } from "./HttpStatusCode.js";

class AppError extends Error {
    public readonly statusCode: HttpStatusCode;
    public readonly isOperational: boolean;

    constructor(msg: string, statusCode: HttpStatusCode, isOperational: boolean = true) {
        super(msg);

        Object.setPrototypeOf(this, new.target.prototype);
        
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this);
    }
}

export default AppError;
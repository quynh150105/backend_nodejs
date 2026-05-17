import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, { statusCode: 401, message: 'No token provided, authorization denied' });
        }

        const token = authHeader.split(' ')[1];
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        
        next();
    } catch (error) {
        return sendError(res, { statusCode: 401, message: 'Token is not valid' });
    }
};

export default authMiddleware;

import { User } from '../models/index.js';
import { sendError } from '../utils/response.js';

const adminMiddleware = async (req, res, next) => {
    try {
        // req.user is set by authMiddleware which runs before this one
        if (!req.user || !req.user.id) {
            return sendError(res, { statusCode: 401, message: 'Authentication required' });
        }


        const user = await User.findById(req.user.id);
        
        if (!user || user.role !== 'admin') {
            return sendError(res, { statusCode: 403, message: 'Access denied. You do not have admin privileges' });
        }

        next();
    } catch (error) {
        return sendError(res, { message: 'Internal server error while checking permissions' });
    }
};

export default adminMiddleware;

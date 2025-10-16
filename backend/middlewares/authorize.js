// import logger from "../config/logger";
export const authForRoles = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Ensure user is authenticated and exists
            if (!req.user) {
                return next({ status: 401, message: 'Unauthorized: User not authenticated' });
            }

            // Log for debugging
            console.log('Current User Role:', req.user.role);
            console.log('Allowed Roles:', allowedRoles);

            // Check if the user's role is in the allowed roles
            const hasAllowedRole = allowedRoles.some(role => 
                req.user.role === role || (Array.isArray(req.user.role) && req.user.role.includes(role))
            )
            if(!hasAllowedRole) {
                return res.status(403).json({ 
                    message: 'Forbidden: Only super_admin can access this resource',
                    userRole: req.user.role,
                    requiredRoles: allowedRoles
                });
            }
            next();
        } catch (error) {
            return next({ status: 500, error });
        }
    }
}
export const sendSuccess = (
    res,
    { statusCode = 200, message = 'Success', data = null, meta = null } = {}
) => {
    const body = {
        success: true,
        message,
        data
    };

    if (meta) {
        body.meta = meta;
    }

    return res.status(statusCode).json(body);
};

export const sendError = (
    res,
    { statusCode = 500, message = 'Internal server error', data = null } = {}
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data
    });
};

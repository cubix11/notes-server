if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};
const jwt = require('jsonwebtoken');
function checkTokenSetUser(req, res, next) {
    const authHeader = req.get('Authorization');
    if(authHeader !== undefined) {
        const token = authHeader.split(' ')[1];
        if(token) {
            jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
                res.user = user;
            });
        }
    }
    next();
};

function isLoggedIn(req, res, next) {
    if(res.user) {
        next();
    } else {
        const error = new Error('Unauthorized');
        res.status(401).json({error: error.message});
    }
};
module.exports = {
    checkTokenSetUser,
    isLoggedIn
}
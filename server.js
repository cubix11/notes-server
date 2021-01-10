const express = require('express');
const app = express();
const middlewares = require('./auth/middlewares');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./auth');
const notes = require('./api/notes');
const PORT = process.env.PORT || 3000;
app.use(express.json());
if(process.env.NODE_ENV !== 'production') {
    const volleyball = require('volleyball');
    app.use(volleyball);
};
app.use(helmet());
app.use(cors());
app.use(middlewares.checkTokenSetUser);
app.get('/checkUser', (req, res) => {
    res.json({
        user: res.user
    })
});
app.use('/auth', authRoutes);
app.use('/api/notes', middlewares.isLoggedIn, notes);
if(process.env.NODE_ENV === 'production') {
    app.use(express.static(__dirname + '/public/'));
    app.get(/.*/, (req, res) => res.sendFile(__dirname + '/public/index.html'));
};
app.listen(PORT || 3000, () => console.log(`localhost:${PORT}`));
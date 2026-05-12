require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');

const connectDB              = require('./config/db');
const { startAlertChecker }  = require('./jobs/alertChecker');
const { initSocket }         = require('./socket/socketManager');

const authRoutes      = require('./routes/auth.routes');
const stockRoutes     = require('./routes/stock.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const alertRoutes     = require('./routes/alert.routes');
const portfolioRoutes = require('./routes/portfolio.routes');

const app        = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:      process.env.CLIENT_URL,
    credentials: true,
  },
});

connectDB();
initSocket(io);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth',      authRoutes);
app.use('/api/stocks',    stockRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts',    alertRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAlertChecker();
});
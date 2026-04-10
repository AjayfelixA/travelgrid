require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route - serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ajay:1234@grocerystore.fa2rpq9.mongodb.net/travelgrid';
mongoose.connect(MONGO_URI).then(() => {
    console.log("MongoDB connected successfully");
}).catch(err => {
    console.error("MongoDB block (whitelist your IP!):", err);
});

// -------------- SCHEMAS --------------
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String }
});
const User = mongoose.model('User', UserSchema);

const ItinerarySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    destination: { type: String, required: true },
    dates: { type: String },
    hotel: { type: String },
    transport: { type: String },
    activities: { type: String },
    order: { type: Number, default: 0 }
});
const Itinerary = mongoose.model('Itinerary', ItinerarySchema);

const BookingSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    destination: { type: String },
    dates: { type: String },
    hotel: { type: String },
    transport: { type: String },
    activities: { type: String },
    totalCost: { type: Number },
    createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', BookingSchema);

// -------------- PUBLIC ENDPOINTS --------------

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'unified-database' });
});

// USERS
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existing = await User.findOne({ username });
        if(existing) return res.status(400).json({ error: "User exists" });
        const user = await User.create({ username, email, password });
        res.status(201).json(user);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        let user = await User.findOne({ username });
        if(!user) {
            // Auto register them for seamless flow if they don't exist
            user = await User.create({ username, email: username + '@example.com', password });
        }
        res.status(200).json(user);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// ITINERARY
app.post('/api/itinerary', async (req, res) => {
    try {
        const { userId, destination, dates, hotel, transport, activities } = req.body;
        const count = await Itinerary.countDocuments({ userId });
        const itin = await Itinerary.create({ userId, destination, dates, hotel, transport, activities, order: count });
        res.status(201).json(itin);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/itinerary/:userId', async (req, res) => {
    try {
        const itins = await Itinerary.find({ userId: req.params.userId }).sort('order');
        const mapped = itins.map(i => {
           let obj = i.toObject();
           obj.id = obj._id.toString();
           return obj;
        });
        res.status(200).json(mapped);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/itinerary/:id', async (req, res) => {
    try {
        await Itinerary.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted" });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/itinerary/reorder', async (req, res) => {
    try {
        const { userId, orderMapping } = req.body;
        for (const mapping of orderMapping) {
             await Itinerary.updateOne({ _id: mapping.id, userId }, { order: mapping.order });
        }
        res.status(200).json({ message: 'Reordered' });
    } catch(e) {
         res.status(500).json({ error: e.message });
    }
});

// BOOKINGS
app.post('/api/booking', async (req, res) => {
    try {
        const { userId, destination, dates, hotel, transport, activities, totalCost } = req.body;
        const booking = await Booking.create({ userId, destination, dates, hotel, transport, activities, totalCost });
        res.status(201).json(booking);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/booking/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.userId }).sort('-createdAt');
        res.status(200).json(bookings);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ TravelGrid server running on http://0.0.0.0:${port}`);
});

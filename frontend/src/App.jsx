import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';

// Configure axios for credentials (cookies)
axios.defaults.withCredentials = true;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', password: '', email: '', phone: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/register`, formData);
            alert('Registration successful! Redirecting to login...');
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="container">
            <h1>Kodbank SignUp</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Username</label>
                    <input type="text" onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                <div className="input-group">
                    <label>Email</label>
                    <input type="email" onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input type="password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                </div>
                <div className="input-group">
                    <label>Phone</label>
                    <input type="text" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <button type="submit">Register</button>
            </form>
            <div className="link">
                Already have an account? <Link to="/login">Login</Link>
            </div>
        </div>
    );
};

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/login`, formData);
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="container">
            <h1>Kodbank SignIn</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Username</label>
                    <input type="text" onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input type="password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                </div>
                <button type="submit">Login</button>
            </form>
            <div className="link">
                Don't have an account? <Link to="/register">Register</Link>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [balance, setBalance] = useState(null);

    const checkBalance = async () => {
        try {
            const res = await axios.get(`${API_BASE}/getBalance`);
            setBalance(res.data.balance);

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to fetch balance');
        }
    };

    return (
        <div className="container dashboard">
            <h1>User Dashboard</h1>
            <button onClick={checkBalance}>Check Balance</button>
            {balance !== null && (
                <div className="balance-card">
                    <p>your balance is :</p>
                    <div className="balance-amount">${balance}</div>
                    <p>🎉 Enjoy your day! 🎉</p>
                </div>
            )}
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/" element={<Login />} />
            </Routes>
        </Router>
    );
};

export default App;

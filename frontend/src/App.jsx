import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Watch from './pages/Watch.jsx';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/watch" element={<Watch />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './Components/Login';
import Welcome from './Components/Welcome';

function App() {
  const [user, setUser] = useState<{ token: string; email: string } | null>(null);
  const navigate = useNavigate();

  const handleLogin = (token: string, user: { id: string; email: string }) => {
    setUser({ token, email: user.email });
    navigate('/welcome');
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/welcome" element={<Welcome loggedInEmail={user?.email} />} />
    </Routes>
  );
}

export default function MainApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}

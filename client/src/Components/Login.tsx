import React, { useState } from 'react';

interface Error {
  msg: string;
}

interface LoginProps {
  onLogin: (token: string, user: { id: string; email: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Logging you in...');
        setTimeout(() => {
          localStorage.setItem('token', data.token); // Storing token
          localStorage.setItem('user', JSON.stringify(data.user)); // Storing user data
          onLogin(data.token, { id: data.user.id, email: data.user.email });
        }, 1500);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error logging in');
    }
  };
  
  

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Registered successfully. Redirecting to login...');
        setTimeout(() => {
          setIsRegistering(false);
          setSuccessMessage('');
        }, 1500);
      } else {
        setError(data.errors ? data.errors.map((err: Error) => err.msg).join(', ') : 'Registration failed');
      }
    } catch (err) {
      setError('Error registering');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
  <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl">
     <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center tracking-wide animate-pulse">
          {isRegistering ? 'Join Us!' : 'Welcome Back!'}
        </h2>

        {successMessage && (
          <div className="mb-4 p-4 text-white bg-green-500 rounded-lg text-center animate-bounce">
            {successMessage}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
          <div className="relative">
            <label className="block text-gray-600 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 border rounded-lg shadow-inner focus:outline-none focus:ring focus:ring-pink-300 transition duration-300"
            />
          </div>
          <div className="relative">
            <label className="block text-gray-600 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-2 border rounded-lg shadow-inner focus:outline-none focus:ring focus:ring-pink-300 transition duration-300"
            />
          </div>
          <button
            type="submit"
            className={`w-full text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 transform ${
              isRegistering
                ? 'bg-green-400 hover:bg-green-500 hover:scale-105'
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
            }`}
          >
            {isRegistering ? 'Create Account' : 'Login'}
          </button>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>

        <p className="text-center text-gray-600 mt-8">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setSuccessMessage('');
              setError('');
            }}
            className="text-indigo-600 font-medium hover:underline"
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

import { Link } from 'react-router-dom'
import { login } from '@api/userAPI'
import { useState } from 'react'
import { useAuth } from '../provider/authProvider'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { setToken, setUser } = useAuth()

  const redirect = () => {
    console.log('redirecting to home page...')
    window.location.href = '/'
  }

  const handleLogin = () => {
    setError('')
    login(username, password, setToken, setUser, redirect, setError)
  }

  const errorMsg =
    error == '' ? '' : <div className="text-red-500 mt-2 text-sm">{error}</div>

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="text-gray-600 font-medium mb-2">Welcome to use</div>
          <h1 className="text-4xl font-bold">
            <div className="text-blue-600">InfluxDB</div>
            <div className="text-gray-800">Viewer</div>
          </h1>
        </div>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Login
          </h1>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">
                Username(Email):
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                type="text"
                name="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">
                Password:
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {errorMsg}
          </div>
          <button
            onClick={handleLogin}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex justify-center items-center"
          >
            Login
          </button>
          <div className="text-center mt-6">
            <Link
              to={`/register`}
              className="text-blue-600 hover:text-blue-800 transition duration-200"
            >
              Register a new account
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login

import { Link, useNavigate } from 'react-router-dom'
import { register } from '@api/userAPI'
import { useState } from 'react'

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm_password, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const redirect = () => {
    navigate('/login', { replace: true })
  }

  const handleRegister = () => {
    setError('')
    register(username, password, redirect, setError)
  }

  const errorMsg =
    password != confirm_password ? (
      <div className="text-red-500 mt-2 text-sm">Password is different</div>
    ) : error == '' ? (
      ''
    ) : (
      <div className="text-red-500 mt-2 text-sm">{error}</div>
    )

  const disableRegister = password != confirm_password ? true : false

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
            Register
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
                name="confirm_password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">
                Confirm Password:
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                type="password"
                name="confirm_password"
                value={confirm_password}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>
            {errorMsg}
          </div>
          <button
            disabled={disableRegister}
            onClick={handleRegister}
            className={`w-full mt-6 font-medium py-3 px-4 rounded-lg transition duration-200 flex justify-center items-center ${
              disableRegister
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Register
          </button>
          <div className="text-center mt-6">
            <Link
              to={`/login`}
              className="text-blue-600 hover:text-blue-800 transition duration-200"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Register

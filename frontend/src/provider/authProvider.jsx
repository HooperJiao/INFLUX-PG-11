import axios from 'axios'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  // State to hold the authentication token
  const [token, setToken_] = useState(localStorage.getItem('token'))
  const [user, setUser_] = useState(JSON.parse(localStorage.getItem('user')))
  const [influxToken, setInfluxToken_] = useState(
    localStorage.getItem('influx_token')
  )
  const [influxOrg, setInfluxOrg_] = useState(
    localStorage.getItem('influx_org')
  )

  // Function to set the authentication token
  const setToken = (newToken) => {
    setToken_(newToken)
  }

  const setTokenAsync = (newToken) => {
    return new Promise((resolve) => {
      setToken_(newToken, resolve)
    })
  }

  // Function to set the InfluxDB token
  const setInfluxToken = (newInfluxToken) => {
    setInfluxToken_(newInfluxToken)
    localStorage.setItem('influx_token', newInfluxToken)
  }

  // Function to set the InfluxDB org
  const setInfluxOrg = (newInfluxOrg) => {
    setInfluxOrg_(newInfluxOrg)
    localStorage.setItem('influx_org', newInfluxOrg)
  }

  const setUser = (newUser) => {
    setUser_(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  // Memoized value of the authentication context
  const contextValue = {
    token,
    setToken,
    setTokenAsync,
    user,
    setUser,
    influxToken,
    setInfluxToken,
    influxOrg,
    setInfluxOrg,
  }

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}

export default AuthProvider

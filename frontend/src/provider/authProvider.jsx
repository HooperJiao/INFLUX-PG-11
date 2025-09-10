import axios from 'axios'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  // State to hold the authentication token
  const [token, setToken_] = useState(localStorage.getItem('token'))
  const [user, setUser_] = useState(JSON.parse(localStorage.getItem('user')))
  const [influxToken, setInfluxToken] = useState('bRNvEgJJ7xdGfi8S303O9MP2v-R-lrETyNpdIXIPcwlR_VAs6nbipV23Yb4tVfx00GDloCGkod1ZoY82-izq4g==')
  const [influxOrg, setInfluxOrg] = useState('University of Adelaide')

  // Function to set the authentication token
  const setToken = (newToken) => {
    setToken_(newToken)
  }

  const setTokenAsync = (newToken) => {
    return new Promise((resolve) => {
      setToken_(newToken, resolve)
    })
  }

  const setUser = (newUser) => {
    setUser_(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  useEffect(() => {
    if (influxToken) {
      console.log('updating token in axios!')
      axios.defaults.headers.common['InfluxToken'] = influxToken
    }
  }, [influxToken])

  useEffect(() => {
    if (influxOrg) {
      console.log('updating org in axios!')
      axios.defaults.headers.common['InfluxOrg'] = influxOrg
    }
  }, [influxOrg])

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token

      localStorage.setItem('token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [token])

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

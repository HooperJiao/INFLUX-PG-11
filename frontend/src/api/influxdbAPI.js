import axios from 'axios'
import { flushSync } from 'react-dom'

const fetchBuckets = (setBuckets, setError) => {
  console.log('start fetching buckets...', axios.defaults.headers)
  axios
    .get('/api/influx/bucket', {})
    .then((result) => {
      const data = result.data
      console.log('fetch buckets result:', result, data)
      setBuckets(data)
    })
    .catch((e) => {
      console.error('fetch buckets error:', e)
      setError('Fetch buckets error.')
    })
}

const fetchMeasurements = (bucket, setMeasurements, setError) => {
  console.log('start fetching buckets...')

  if (bucket === '') {
    setError('bucket is null')
    return
  }

  axios
    .get(`/api/influx/measurement?bucket=${bucket}`, {})
    .then((result) => {
      const data = result.data
      console.log('fetch measurements result:', result, data)
      setMeasurements(data)
    })
    .catch((e) => {
      console.error('fetch measurements error:', e)
      setError('Fetch measurements error.')
    })
}

const fetchFields = (bucket, measurement, setFields, setError) => {
  console.log('start fetching fields...')

  if (bucket === '') {
    setError('bucket is null')
    return
  }

  if (measurement === '') {
    setError('measurement is null')
    return
  }

  axios
    .get(`/api/influx/field?bucket=${bucket}&measurement=${measurement}`, {})
    .then((result) => {
      const data = result.data
      console.log('fetch fields result:', result, data)

      // Remove name is empty data
      const fields = data.filter((f) => f.name != '')

      setFields(fields)
    })
    .catch((e) => {
      console.error('fetch fields error:', e)
      setError('Fetch fields error.')
    })
}

const doQuery = (query, setData, setError) => {
  if (query == '') {
    setError('no query.')
    return
  }

  // if (query.indexOf('limit') == -1) {
  //   setError('no limit.')
  //   return
  // }

  axios
    .get(`/api/influx/query?sql=${query}`, {})
    .then((result) => {
      const data = result.data
      console.log('fetch fields result:', result, data)
      setData(data)
    })
    .catch((e) => {
      console.error('fetch fields error:', e)
      setError('Fetch fields error.')
    })
}

const queryGraph = (query, graphType, setData, setError) => {
  if (query == '') {
    setError('no query.')
    return
  }

  // if (query.indexOf('limit') == -1) {
  //   setError('no limit.')
  //   return
  // }

  axios
    .get(`/api/influx/query/graph?sql=${query}&graph_type=${graphType}`, {})
    .then((result) => {
      const data = result.data
      console.log('query result:', result, data)
      setData(data)
    })
    .catch((e) => {
      console.error('query error:', e)
      setError('Query error.')
    })
}

const fetchGraphs = (setGraphs, setError) => {
  console.log('start fetching dashboards...')
  axios
    .get('/api/influx/graph', {})
    .then((result) => {
      const data = result.data
      console.log('fetch graphs result:', result, data)
      setGraphs(data)
    })
    .catch((e) => {
      console.error('fetch graphs error:', e)
      setError('Fetch graphs error.')
    })
}

const createGraph = (graph, setError) => {
  console.log('start create graph ...', graph)

  axios
    .post(`/api/influx/graph`, graph)
    .then((result) => {
      const data = result.data
      console.log('create graph result:', result, data)
      // fetchGraphs(setGraphs, setError)
    })
    .catch((e) => {
      console.error('create graph error:', e)
      setError('Create graph error.')
    })
}

const deleteGraph = (id, setGraphs, setError) => {
  console.log('start delete graph...')

  axios
    .delete(`/api/influx/graph?id=${id}`)
    .then((result) => {
      console.log('delete graph success:', result)
      fetchGraphs(setGraphs, setError)
    })
    .catch((e) => {
      console.error('delete graph error:', e)
      setError('Delete failed.')
    })
}

const downloadExcel = async (sql) => {
  try {
    // 使用 axios 发送 GET 请求，追加新的 headers 而不覆盖现有 headers
    const response = await axios.get(`/api/influx/download/excel`, {
      params: { sql: sql },
      responseType: 'blob', // 处理为二进制大对象
      headers: {
        ...axios.defaults.headers.common, // 保留已存在的 headers
        'Content-Type': 'application/json',
      },
    })

    // 处理下载文件
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'data.xlsx') // 下载的文件名
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link) // 移除临时链接
  } catch (error) {
    console.error('Download failed:', error)
  }
}

const downloadCSV = async (sql) => {
  try {
    // 使用 axios 发送 GET 请求，追加新的 headers 而不覆盖现有 headers
    const response = await axios.get(`/api/influx/download/csv`, {
      params: { sql: sql },
      responseType: 'blob', // 处理为二进制大对象
      headers: {
        ...axios.defaults.headers.common, // 保留已存在的 headers
        'Content-Type': 'application/json',
      },
    })

    // 处理下载文件
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'data.csv') // 下载的文件名
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link) // 移除临时链接
  } catch (error) {
    console.error('Download failed:', error)
  }
}

const downloadTXT = async (sql) => {
  try {
    // 使用 axios 发送 GET 请求，追加新的 headers 而不覆盖现有 headers
    const response = await axios.get(`/api/influx/download/txt`, {
      params: { sql: sql },
      responseType: 'blob', // 处理为二进制大对象
      headers: {
        ...axios.defaults.headers.common, // 保留已存在的 headers
        'Content-Type': 'application/json',
      },
    })

    // 处理下载文件
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'data.TXT') // 下载的文件名
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link) // 移除临时链接
  } catch (error) {
    console.error('Download failed:', error)
  }
}

export {
  fetchBuckets,
  fetchMeasurements,
  fetchFields,
  doQuery,
  queryGraph,
  fetchGraphs,
  createGraph,
  deleteGraph,
  downloadExcel,
  downloadCSV,
  downloadTXT,
}

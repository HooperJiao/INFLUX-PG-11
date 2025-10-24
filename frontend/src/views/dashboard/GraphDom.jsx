import { useState, useEffect } from 'react'
import { createGraph, queryGraph, fetchGraphs } from '@api/influxdbAPI'

function useGraph() {
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date())
  const [SQLLimit, setSQLLimit] = useState(-1)
  const [graphType, setGraphType] = useState('timeseries')
  const [limit, setLimit] = useState(-1)
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('Unnamed')
  const [shareURL, setShareURL] = useState('')

  const fetchQuery = ({ sql, _startTime, _endTime, _limit, setError }) => {
    console.log('fetchQuery...', sql, _startTime, _endTime, _limit)

    setShareURL('')
    queryGraph(sql, graphType, setShareURL, setError)
    setQuery(sql)
    setStartTime(_startTime)
    setEndTime(_endTime)
    setSQLLimit(_limit)
  }

  useEffect(() => {
    var iframe = document.getElementById('iframe-graph')
    if (iframe != undefined) {
      iframe.contentWindow.location.reload()
    }
  }, [shareURL])

  const setError = () => {}

  const saveGraph = () => {
    const graph = {
      title: title,
      query: query,
      range_start: startTime,
      range_end: endTime,
      limit: limit,
    }
    console.log('saving current graph...', graph)
    createGraph(graph, setError)
  }

  const container = (
    <>
      {shareURL == '' ? (
        ''
      ) : (
        <div>
          <div className="flex justify-between space-x-2">
            <div className="flex items-center space-x-2 justify-between mb-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="graph-type">Graph Type</label>
                <select
                  className="border border-gray-200 rounded-xl p-2"
                  name="graph-type"
                  id="graph-type"
                  value={graphType}
                  onChange={(e) => setGraphType(e.target.value)}
                >
                  <option value="timeseries">Time series</option>
                  <option value="barchart">Bar chart</option>
                  <option value="piechart">Pie Chart</option>
                </select>
              </div>
              <button
                className="mb-2"
                onClick={() =>
                  fetchQuery({
                    sql: query,
                    _startTime: startTime,
                    _endTime: endTime,
                    _limit: SQLLimit,
                    setError: setError,
                  })
                }
              >
                Apply Graph Type
              </button>
            </div>

            <div className="flex items-center space-x-2 justify-between mb-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="new-graph-title">Title: </label>
                <input
                  className="w-96 border border-gray-200 rounded-xl p-2 "
                  id="new-graph-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="graph-limit">Limit</label>
                <select
                  className="border border-gray-200 rounded-xl p-2"
                  name="graph-Limit"
                  id="graph-limit"
                  value={(e) => setLimit(e.target.value)}
                >
                  <option value="-1">-1(No Limit)</option>
                  <option value={SQLLimit}>{SQLLimit}(The same as SQL)</option>
                </select>
              </div>
              <button className="mb-2" onClick={() => saveGraph()}>
                Save To Grafana
              </button>
            </div>
          </div>
          <iframe
            id="iframe-graph"
            className="w-full h-full min-h-96"
            src={shareURL}
          ></iframe>
        </div>
      )}
    </>
  )

  return {
    container,
    setShareURL,
    fetchQuery,
  }
}

export default useGraph

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../provider/authProvider'
import { logout } from '../../api/userAPI'
import { doQuery } from '../../api/influxdbAPI'
import { useState, useEffect } from 'react'

import { SelectListDom } from '@components/selectListDom'
import { SelectFieldDom } from '@components/selectFieldDom'
import { FilterFieldDom } from '@components/filterFieldDom'
import { TableDom } from '@components/tableDom'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { flushSync } from 'react-dom'
import Tab from '../../components/tab'
import useBuckets from './BuckectsDom'
import useMeasurements from './measurementsDom'
import useFields from './fieldsDom'
import useGraph from './GraphDom'

import History from './History'
import SQLTexture from './SQLTexture'

function Dashboard() {
  const [error, setError] = useState('')
  const [inputInfluxToken, setInputInfluxToken] = useState('')
  const [inputInfluxOrg, setInputInfluxOrg] = useState('')
  const [selectBucket, setSelectBucket] = useState('')
  const [selectMeasurement, setSelectMeasurement] = useState('')
  const [selectFields, setSelectFields] = useState([])
  const [filterFields, setFilterFields] = useState([])

  const [startTime, setStartTime] = useState(
    new Date('1980-01-01T00:00:00.000Z')
  )
  const [endTime, setEndTime] = useState(new Date())

  const [limit, setLimit] = useState('')

  const {
    user,
    setToken,
    influxToken,
    setInfluxToken,
    influxOrg,
    setInfluxOrg,
  } = useAuth()
  const navigate = useNavigate()
  const { BucketsDom, buckets, fetchBuckets } = useBuckets({
    bucket: selectBucket,
    setBucket: setSelectBucket,
  })
  const { MeasurementsDom, measurements } = useMeasurements({
    bucket: selectBucket,
    measurement: selectMeasurement,
    setMeasurement: setSelectMeasurement,
  })
  const { FieldsDom, fields } = useFields({
    bucket: selectBucket,
    measurement: selectMeasurement,
  })
  const {
    container: graphDom,
    setShareURL,
    fetchQuery: fetchGraph,
  } = useGraph()

  const [tableData, setTableData] = useState([
    {
      _measurement: '',
      _field: '',
      _value: '',
      _start: '',
      _stop: '',
      _time: '',
    },
  ])

  useEffect(() => {
    if (buckets.length > 0) {
      console.log('buckets updated, so update select bucket...')
      setSelectBucket(buckets[0])
    }
  }, [buckets])

  useEffect(() => {
    if (measurements.length > 0) {
      console.log('measurements updated, so update select bucket...')
      setSelectMeasurement(measurements[0])
    }
  }, [measurements])

  function handleQuery() {
    console.log('start query...')
    doQuery(sql, setTableData, setError)
    fetchGraph({
      sql,
      _startTime: startTime,
      _endTime: endTime,
      _limit: limit,
      setError: setError,
    })
  }

  function addSelect(field) {
    if (selectFields.findIndex((element) => element.name == field.name) > -1) {
      console.log('this field have exists.')
      return
    }

    let newSelctField = {
      bucket: field.bucket,
      measurement: field.measurement,
      data_type: field.data_type,
      name: field.name,
      alias: '',
    }
    // generate alias name
    let id = 0
    let alias = `field_${id}`

    while (selectFields.findIndex((element) => element.alias == alias) > -1) {
      id = id + 1
      alias = `field_${id}`
    }

    newSelctField.alias = alias
    let current = [...selectFields, newSelctField]

    console.log('copy new field into select fields:', selectFields, current)
    flushSync(() => {
      setSelectFields(current)
    })
  }

  function addFilter(field) {
    // default filter is:
    // {combine_type} {name} {op} {right}, e.g: and xxx = ''
    let newFilterField = {
      combine_type: 'and',
      bucket: field.bucket,
      measurement: field.measurement,
      data_type: field.data_type,
      name: field.name,
      alias: '',
      op: '=',
      right: '',
    }
    // generate alias name
    let id = 0
    let alias = `field_${id}`

    while (filterFields.findIndex((element) => element.alias == alias) > -1) {
      id = id + 1
      alias = `field_${id}`
    }

    newFilterField.alias = alias
    let current = [...filterFields, newFilterField]

    console.log('copy new field into filter fields:', filterFields, current)
    flushSync(() => {
      setFilterFields(current)
    })
  }

  function deleteSelect(alias) {
    const currentSelects = [...selectFields]
    const index = selectFields.findIndex((element) => element.alias == alias)
    if (index == -1) {
      return
    }
    console.log('try to delete select field', alias)
    currentSelects.splice(index, 1)
    setSelectFields(currentSelects)
  }

  function deleteFilter(alias) {
    const currentFilters = [...filterFields]
    const index = filterFields.findIndex((element) => element.alias == alias)
    if (index == -1) {
      return
    }
    console.log('try to delete filter field', alias)
    currentFilters.splice(index, 1)
    setFilterFields(currentFilters)
  }

  function updateFilter(newFilter) {
    const currentFilters = [...filterFields]
    const index = filterFields.findIndex(
      (element) => element.alias == newFilter.alias
    )
    if (index == -1) {
      return
    }
    console.log('try to update filter field', newFilter)
    currentFilters[index] = newFilter
    setFilterFields(currentFilters)
  }

  const redirect = () => {
    navigate('/login', { replace: true })
  }

  const genSQL = (fields, filters) => {
    if (fields.length == 0) {
      return ''
    }

    // get target bucket
    const bucket = fields[0].bucket
    // get target measurement
    const measurement = fields[0].measurement

    // generate select measurements
    const selectFieldsStr = fields.reduce((result, field, index) => {
      if (index === 0) {
        return `r[\"_field\"] == \"${field.name}\"`
      } else {
        return result + ` or r[\"_field\"] == \"${field.name}\"`
      }
    }, '')

    console.log('start', startTime, 'end', endTime)
    let timerange = ''
    if (new Date(endTime).toISOString() == new Date(startTime).toISOString()) {
      timerange = `start: ${new Date(startTime).toISOString()}`
    } else if (new Date(endTime) > new Date(startTime)) {
      timerange = `start: ${new Date(
        startTime
      ).toISOString()}, stop: ${new Date(endTime).toISOString()}`
    } else {
      timerange = `start: ${new Date(endTime).toISOString()}, stop: ${new Date(
        startTime
      ).toISOString()}`
    }

    // generate filters
    let filtersStr = ''
    if (filters.length > 0) {
      filtersStr = filters.reduce((result, filter_, index) => {
        if (filter_.right == '') {
          return result
        }

        let condition = `((r["_field"] == "${filter_.name}" and r["_value"] ${filter_.op} ${filter_.right}) or r["_field"] != "${filter_.name}")`
        if (index > 0) {
          condition = ` ${filter_.combine_type} ` + condition
        }
        return result + condition
      }, '')

      if (filtersStr != '') {
        filtersStr = `|> filter(fn: (r) => ${filtersStr})`
      }
    }

    let sql = `from(bucket: "${bucket}")
  |> range(${timerange})
  |> filter(fn: (r) => r["_measurement"] == "${measurement}")
  |> filter(fn: (r) => ${selectFieldsStr})
  ${filtersStr}
`

    if (limit != '') {
      sql += `  |> limit(n: ${limit})`
    }

    return sql
  }

  const sql = genSQL(selectFields, filterFields)

  const sqlTextare = <textarea className="" defaultValue={sql}></textarea>

  const dataTable = <TableDom data={tableData} sql={sql} />

  const tabData = [
    { title: 'SQL', content: sqlTextare },
    { title: 'Table', content: dataTable },
    // { title: 'Graph', content: graphDom },
    // { title: 'Saved List', content: <History /> },
  ]

  function handleQuery() {
    console.log('start query...')
    doQuery(sql, setTableData, setError)
    // fetchGraph({
    //   sql,
    //   _startTime: startTime,
    //   _endTime: endTime,
    //   _limit: limit,
    //   setError: setError,
    // })
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DndProvider backend={HTML5Backend}>
          <nav className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <div className="text-gray-700 font-medium">
              Current Login: {user.email}
            </div>
            <button
              onClick={() => {
                logout(setToken, redirect)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              Logout
            </button>
          </nav>
          <h1 className="text-3xl font-bold text-center my-6 text-gray-800">
            <div className="text-blue-600">ATSYS</div>
            <div className="text-gray-700">Dashboard</div>
          </h1>
          <div className="flex-grow p-6">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                  1
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  Influx Token and Organization:
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  value={inputInfluxToken}
                  onChange={(e) => setInputInfluxToken(e.target.value)}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter token here."
                />
                <input
                  value={inputInfluxOrg}
                  onChange={(e) => setInputInfluxOrg(e.target.value)}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Org"
                />
                <button
                  onClick={() => {
                    console.log('updating token and org...')
                    setInfluxToken(inputInfluxToken)
                    setInfluxOrg(inputInfluxOrg)
                    fetchBuckets(setError)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition duration-200 whitespace-nowrap"
                >
                  Fetch Buckets
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                  2
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  Make Query:
                </div>
              </div>

              <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      {BucketsDom}
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      {MeasurementsDom}
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      {FieldsDom}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700">
                    Choose Fields:
                  </h2>
                  <div>
                    <SelectListDom handleDrop={addSelect} state={selectFields}>
                      {selectFields.map((field, index) => (
                        <SelectFieldDom
                          key={`select-field-${index}`}
                          field={field}
                          deleteSelect={deleteSelect}
                        />
                      ))}
                    </SelectListDom>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700">
                    Filter:
                  </h2>
                  <div className="">
                    <SelectListDom handleDrop={addFilter} state={filterFields}>
                      {filterFields.map((field, index) => (
                        <FilterFieldDom
                          key={`filter-field-${index}`}
                          field={field}
                          deleteFilter={deleteFilter}
                          updateFilter={updateFilter}
                        />
                      ))}
                    </SelectListDom>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex flex-wrap gap-6 items-center justify-between">
                <div className="">
                  <h2 className="text-lg font-semibold mb-2 text-gray-700">
                    Amount Limit:
                  </h2>
                  <div className="">
                    <select
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">No Limit</option>
                      <option value="10">10</option>
                      <option value="100">100</option>
                      <option value="500">500</option>
                    </select>
                  </div>
                </div>
                <div className="">
                  <div className="text-lg font-semibold mb-2 text-gray-700">
                    Time Range:
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type="datetime-local"
                    />
                    <h2 className="font-bold text-gray-500">~</h2>
                    <input
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type="datetime-local"
                    />
                  </div>
                </div>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md transition duration-200 font-medium text-lg whitespace-nowrap"
                  onClick={handleQuery}
                >
                  Submit
                </button>
              </div>
            </div>

            {/* Show the SQL Results */}
            <SQLTexture
              selectFields={selectFields}
              filterFields={filterFields}
              startTime={startTime}
              endTime={endTime}
              limit={limit}
            />
            {/* Show the SQL Results */}

            {/* Show Table: */}
            <TableDom data={tableData} sql={sql} />
            {/* Show Table: */}
          </div>
        </DndProvider>
      </div>
    </>
  )
}

export default Dashboard

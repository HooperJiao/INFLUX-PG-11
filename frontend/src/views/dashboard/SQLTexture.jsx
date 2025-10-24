import PropTypes from 'prop-types'
import { useState } from 'react'

function SQLTexture({ selectFields, filterFields, startTime, endTime, limit }) {
  const [open, setOpen] = useState(true)
  const makeFluxSQL = (fields, filters, startTime, endTime, limit) => {
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
        return `r["_field"] == "${field.name}"`
      } else {
        return result + ` or r["_field"] == "${field.name}"`
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
  ${filtersStr}`

    if (limit) {
      sql += `  |> limit(n: ${limit})`
    }

    return sql
  }

  const [sql, setSql] = useState('')

  return (
    <>
      {open ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex w-full items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Flux SQL</h2>
              <button onClick={() => setOpen(false)}>Hide</button>
            </div>

            <textarea
              className="w-full min-h-96 border border-gray-500 rounded p-4"
              defaultValue={sql}
            ></textarea>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => {
                setSql(
                  makeFluxSQL(
                    selectFields,
                    filterFields,
                    startTime,
                    endTime,
                    limit
                  )
                )
              }}
            >
              Generate Flux SQL
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Flux SQL</h2>
            <button onClick={() => setOpen(true)}>Expand</button>
          </div>
        </div>
      )}
    </>
  )
}

SQLTexture.propTypes = {
  selectFields: PropTypes.array.isRequired,
  filterFields: PropTypes.array.isRequired,
  startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  limit: PropTypes.number,
}

export default SQLTexture

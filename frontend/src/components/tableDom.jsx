import { downloadExcel, downloadCSV, downloadTXT } from '../api/influxdbAPI'
import { useState } from 'react'
export const TableDom = ({ data, sql }) => {
  const [open, setOpen] = useState(true)
  const cols = ['_measurement', '_field', '_value', '_start', '_stop', '_time']
  return (
    <>
      {open ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 gap-4 flex flex-col">
          <div className="flex justify-between items-center space-x-2">
            {/* <button onClick={() => downloadExcel(sql)}>Download Excel</button> */}

            <h2 className="text-2xl font-bold text-gray-800">Query Result</h2>
            <div className="space-x-2">
              <button onClick={() => downloadCSV(sql)}>Download CSV</button>
              <button onClick={() => setOpen(false)}>Hide</button>
            </div>

            {/* <button onClick={() => downloadTXT(sql)}>Download TXT</button> */}
          </div>

          <table className="w-full">
            <thead>
              {cols.map((col, i) => (
                <th
                  className="rounded-t-xl border border-gray-500 p-2"
                  key={`col-${i}`}
                >
                  {col}
                </th>
              ))}
            </thead>
            <tbody>
              {data.map((row, rowi) => {
                return (
                  <tr key={`row-${rowi}`}>
                    {cols.map((col, coli) => (
                      <td
                        className="border border-gray-500 p-2"
                        key={`row-${rowi}-${coli}`}
                      >
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 gap-4 flex flex-col">
          <div className="flex justify-between items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-800">Query Result</h2>
            <button onClick={() => setOpen(true)}>Expand</button>
          </div>
        </div>
      )}
    </>
  )
}

import { downloadExcel, downloadCSV, downloadTXT } from '../api/influxdbAPI'

export const TableDom = ({ data, sql }) => {
  const cols = ['_measurement', '_field', '_value', '_start', '_stop', '_time']
  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 gap-4 flex flex-col">
        {/* <div className="flex space-x-2">
          <button onClick={() => downloadExcel(sql)}>Download Excel</button>

          <button onClick={() => downloadCSV(sql)}>Download CSV</button>

          <button onClick={() => downloadTXT(sql)}>Download TXT</button>
        </div> */}
        <h2 className="text-2xl font-bold text-gray-800">Query Result</h2>

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
    </>
  )
}

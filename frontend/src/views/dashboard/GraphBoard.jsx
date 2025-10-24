import { useState } from 'react'
export const GraphBoard = ({ graphDom }) => {
  const [open, setOpen] = useState(true)
  return (
    <>
      {open ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 gap-4 flex flex-col">
          <div className="flex justify-between items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-800">Grafana Graphs</h2>
            <button onClick={() => setOpen(false)}>Hide</button>
          </div>
          {graphDom}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 gap-4 flex flex-col">
          <div className="flex justify-between items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-800">Grafana Graphs</h2>
            <button onClick={() => setOpen(true)}>Expand</button>
          </div>
        </div>
      )}
    </>
  )
}

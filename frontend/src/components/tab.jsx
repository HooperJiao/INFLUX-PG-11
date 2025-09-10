import { useState } from 'react'
function Tab({ data }) {
  const [active, setActive] = useState(data[0].title)

  const display =
    data.filter((t) => t.title === active).length > 0
      ? data.filter((t) => t.title === active)[0].content
      : ''

  return (
    <>
      <div className="flex flex-col w-full">
        <div className="flex space-x-4">
          {data.map((type, index) => (
            <div
              key={`tab-${index}`}
              className={
                (active === type.title
                  ? '  text-sky-500 border-b-4 border-b-sky-500'
                  : '  text-gray-300 ') + ' text-3xl font-bold cursor-pointer'
              }
              onClick={() => setActive(type.title)}
            >
              {type.title}
            </div>
          ))}
        </div>
        <div className=" py-4 ">{display}</div>
      </div>
    </>
  )
}

export default Tab

export const SelectFieldDom = ({ field, deleteSelect }) => {
  return (
    <>
      <div
        className={`flex items-center bg-gray-50 rounded p-2 hover:bg-blue-500 hover:text-white`}
      >
        {/* <span className="p-1 text-sm bg-blue-300 text-white rounded mr-2">
          {field.data_type}
        </span> */}
        <span className="p-1 text-sm bg-blue-300 text-white rounded mr-2">
          {field.name}
        </span>
        <button
          onClick={() => deleteSelect(field.alias)}
          className="py-1 px-3 text-sm bg-red-500  rounded mr-2 text-white"
        >
          {' '}
          Delete{' '}
        </button>
      </div>
    </>
  )
}

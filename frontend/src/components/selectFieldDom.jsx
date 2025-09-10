export const SelectFieldDom = ({ field, deleteSelect }) => {
  return (
    <>
      <div
        className={`flex items-center bg-gray-50 rounded-3xl p-2 hover:bg-sky-500 hover:text-white`}
      >
        {/* <span className="p-1 text-sm bg-sky-300 text-white rounded-2xl mr-2">
          {field.data_type}
        </span> */}
        <span className="p-1 text-sm bg-sky-300 text-white rounded-2xl mr-2">
          {field.name}
        </span>
        <button
          onClick={() => deleteSelect(field.alias)}
          className="py-1 px-3 text-sm bg-red-500  rounded-2xl mr-2 text-white"
        >
          {' '}
          Delete{' '}
        </button>
      </div>
    </>
  )
}

export const FilterFieldDom = ({ field, deleteFilter, updateFilter }) => {
  const _updateFilter = (e, type) => {
    const newFilter = { ...field }
    const newValue = e.target.value
    if (type == 'combine_type') {
      newFilter.combine_type = newValue
    } else if (type == 'op') {
      newFilter.op = newValue
    } else if (type == 'right') {
      newFilter.right = newValue
    } else {
      console.log('unknown filter update type:', type)
      return
    }
    updateFilter(newFilter)
  }

  const invalid =
    field.right == '' ? ' border border-red-500 bg-red-200' : ' bg-gray-50'

  return (
    <>
      <div className={`flex items-center rounded-3xl p-2` + invalid}>
        <select
          value={field.combine_type}
          onChange={(e) => _updateFilter(e, 'combine_type')}
          className="p-1 text-sm bg-gray-100  rounded-2xl mr-2"
        >
          <option value="and">and</option>
          <option value="or">or</option>
        </select>
        {/* <span className='p-1 text-sm bg-gray-100  rounded-2xl mr-2'>
        {field.data_type}
      </span> */}
        <span className="p-1 text-sm bg-gray-100  rounded-2xl">
          {field.name}
        </span>
        {/* {field.alias} */}
        <select
          value={field.op}
          onChange={(e) => _updateFilter(e, 'op')}
          className="p-1 text-sm bg-gray-100  rounded-2xl mx-2"
        >
          <option value="=">=</option>
          <option value=">">&gt;</option>
          <option value=">=">&gt;=</option>
          <option value="<">&lt;</option>
          <option value="<=">&lt;=</option>
          <option value="!=">!=</option>
        </select>
        <input
          className="py-1 px-2 text-sm bg-gray-100  rounded-2xl mr-2"
          type="text"
          value={field.right}
          onChange={(e) => _updateFilter(e, 'right')}
        />
        <button
          onClick={() => deleteFilter(field.alias)}
          className="py-1 px-3 text-sm bg-red-500  rounded-2xl mr-2 text-white"
        >
          {' '}
          Delete{' '}
        </button>
      </div>
    </>
  )
}

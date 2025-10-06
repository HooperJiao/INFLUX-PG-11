import { useDrag } from 'react-dnd'
export const FieldDom = ({ field }) => {
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: 'box',
      item: field,
    }),
    [field]
  )

  return (
    <>
      <div
        ref={drag}
        className={`flex items-center bg-gray-50 rounded py-2 px-2 hover:bg-blue-500 hover:text-white`}
      >
        {/* <span className='p-0.5 text-sm bg-blue-300 text-white rounded-2xl mr-2'>
        {field.data_type}
      </span> */}
        {field.name}
      </div>
    </>
  )
}

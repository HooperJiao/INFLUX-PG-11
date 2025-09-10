import { useDrop } from 'react-dnd'

const setBgColor = (isActive, canDrop) => {
  if (isActive) {
    return ' bg-gray-200'
  } else if (canDrop) {
    return ' bg-gray-500'
  } else {
    return ' bg-white'
  }
}

export const SelectListDom = ({ handleDrop, state, children }) => {
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: 'box',
      drop: (item) => {
        handleDrop(item)
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [state]
  )
  const isActive = canDrop && isOver
  const bgColor = setBgColor(isActive, canDrop)

  return (
    <>
      <div
        ref={drop}
        className={`flex flex-col border border-gray-200 rounded-xl p-2 space-y-2 min-h-20 h-full ${bgColor}`}
      >
        {children}
      </div>
    </>
  )
}

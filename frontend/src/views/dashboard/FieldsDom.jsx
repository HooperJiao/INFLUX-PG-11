import { useFields as _useFields } from '@utils/useInflux'
import { useState, useEffect } from 'react'
import { FieldDom } from '@components/fieldDom'
function useFields({ bucket, measurement }) {
  const [error, setError] = useState('')
  const { fields, fetchFields } = _useFields(setError)

  useEffect(() => {
    console.log('update fields dom...')
    if (bucket !== '' && measurement !== '') {
      fetchFields(bucket, measurement)
    }
  }, [measurement])

  const FieldsDom = (
    <div className="w-full">
      <h2 className="">Fields:</h2>
      <div className="flex items-center ">
        {fields.map((f, index) => (
          <FieldDom key={`field-${index}`} field={f} />
        ))}
      </div>
    </div>
  )
  return { FieldsDom, fields }
}

export default useFields

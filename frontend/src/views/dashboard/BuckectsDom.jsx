import {
  useBuckets as _useBuckets,
  useMeasurements,
  useFields,
} from '@utils/useInflux'
import { useState, useEffect } from 'react'
import { Select } from '../../components/select'
function useBuckets({ bucket, setBucket }) {
  const [error, setError] = useState('')
  const { buckets, fetchBuckets } = _useBuckets(setError)

  const BucketsDom = (
    <div className="w-full">
      <Select
        title={'Bucket'}
        options={buckets}
        value={bucket}
        changeValue={setBucket}
      />
    </div>
  )
  return { BucketsDom, buckets, fetchBuckets }
}

export default useBuckets
